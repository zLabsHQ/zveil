//! Real chain mode — view-only scanning against lightwalletd/Zaino.
//!
//! What this does:
//!   - Decodes a Unified Full Viewing Key (view-only; the scanner can never spend).
//!   - Derives real diversified Unified Addresses, one per invoice.
//!   - Streams compact blocks from lightwalletd, trial-decrypts every shielded
//!     output with the account's incoming viewing keys (Orchard keys also cover
//!     Ironwood under NU6.3), and posts signed webhook events when a payment
//!     lands on an address we allocated.
//!
//! What this deliberately does not do: track spends, build transactions, or act
//! as a wallet. Zveil's scanner only needs detection — reconciliation happens
//! in the web app.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use orchard::note_encryption::{IronwoodDomain, OrchardDomain};
use tonic::transport::Channel;
use zcash_client_backend::{
    proto::{
        compact_formats::CompactBlock,
        service::{
            compact_tx_streamer_client::CompactTxStreamerClient, BlockId, BlockRange, ChainSpec,
        },
    },
    scanning::{scan_block, ScanningKey, ScanningKeys, SpendIdentifiers},
};
use zcash_keys::keys::UnifiedAddressRequest;
use zcash_protocol::{
    consensus::{self, BlockHeight, MainNetwork, TestNetwork},
    local_consensus::LocalNetwork,
};
use zip32::Scope;

use crate::{post_event, AppState, Event};

/// One imported viewing key.
pub struct ChainAccount {
    pub ufvk: String,
    pub webhook_url: String,
    /// raw orchard receiver bytes → (unified address, diversifier index)
    pub addresses: HashMap<[u8; 43], (String, u64)>,
}

pub struct Chain<P: consensus::Parameters> {
    pub params: P,
    pub endpoint: String,
    /// account_id → imported key data
    pub accounts: Mutex<HashMap<String, ChainAccount>>,
    /// txid → pending confirmation tracking
    pending: Mutex<HashMap<String, Pending>>,
    scanned_height: Mutex<u32>,
}

struct Pending {
    account_id: String,
    address: String,
    zats: u64,
    pool: String,
    output_index: u32,
    mined_height: u32,
    last_conf: u32,
}

#[allow(unexpected_cfgs)]
fn regtest_params() -> LocalNetwork {
    let one = Some(BlockHeight::from_u32(1));
    LocalNetwork {
        overwinter: one,
        sapling: one,
        blossom: one,
        heartwood: one,
        canopy: one,
        nu5: one,
        nu6: one,
        nu6_1: one,
        nu6_2: one,
        nu6_3: one,
        nu7: None,
        #[cfg(zcash_unstable = "nutachyon")]
        nu_tachyon: one,
    }
}

impl<P: consensus::Parameters + Send + Sync + 'static> Chain<P> {
    pub fn new(params: P, endpoint: String) -> Self {
        Self {
            params,
            endpoint,
            accounts: Mutex::new(HashMap::new()),
            pending: Mutex::new(HashMap::new()),
            scanned_height: Mutex::new(0),
        }
    }

    fn uivk(&self, ufvk: &str) -> Result<zcash_keys::keys::UnifiedIncomingViewingKey, String> {
        zcash_keys::keys::UnifiedIncomingViewingKey::decode(&self.params, ufvk)
            .map_err(|e| format!("invalid UFVK: {:?}", e))
    }

    /// Validate + register a UFVK. Returns the scanner account id.
    pub fn import(&self, account_id: &str, ufvk: &str, webhook_url: &str) -> Result<(), String> {
        self.uivk(ufvk)?; // reject malformed keys early
        let mut map = self.accounts.lock().unwrap();
        match map.get_mut(account_id) {
            // idempotent re-import: keep watched addresses
            Some(a) if a.ufvk == ufvk => a.webhook_url = webhook_url.to_string(),
            _ => {
                map.insert(
                    account_id.to_string(),
                    ChainAccount {
                        ufvk: ufvk.to_string(),
                        webhook_url: webhook_url.to_string(),
                        addresses: HashMap::new(),
                    },
                );
            }
        }
        Ok(())
    }

    /// Derive a real diversified Unified Address for this account.
    pub fn allocate(&self, account_id: &str, diversifier_index: u64) -> Result<String, String> {
        let mut map = self.accounts.lock().unwrap();
        let acct = map.get_mut(account_id).ok_or("account not found")?;
        let uivk = self.uivk(&acct.ufvk)?;
        let (ua, found_index) = uivk
            .find_address(
                zip32::DiversifierIndex::from(diversifier_index),
                UnifiedAddressRequest::ALLOW_ALL,
            )
            .map_err(|e| format!("address derivation failed: {:?}", e))?;
        let orchard = ua
            .orchard()
            .ok_or("UFVK has no Orchard receiver — Zveil requires a shielded receiver")?;
        let found = u64::try_from(found_index).unwrap_or(diversifier_index);
        acct.addresses.insert(
            orchard.to_raw_address_bytes(),
            (ua.encode(&self.params), found),
        );
        Ok(ua.encode(&self.params))
    }

    fn scanning_keys(&self) -> ScanningKeys<u32, (u32, Scope)> {
        let mut orchard: HashMap<
            (u32, Scope),
            Box<
                dyn zcash_client_backend::scanning::ScanningKeyOps<
                        OrchardDomain,
                        u32,
                        orchard::note::Nullifier,
                    > + Send
                    + Sync,
            >,
        > = HashMap::new();
        let mut ironwood: HashMap<
            (u32, Scope),
            Box<
                dyn zcash_client_backend::scanning::ScanningKeyOps<
                        IronwoodDomain,
                        u32,
                        orchard::note::Nullifier,
                    > + Send
                    + Sync,
            >,
        > = HashMap::new();
        let sapling = HashMap::new();

        let map = self.accounts.lock().unwrap();
        for (i, acct) in map.values().enumerate() {
            let account_id = i as u32;
            if let Ok(uivk) = self.uivk(&acct.ufvk) {
                if let Some(ivk) = uivk.orchard() {
                    for scope in [Scope::External, Scope::Internal] {
                        // Same Orchard IVK covers both pools — Ironwood outputs
                        // trial-decrypt with Orchard viewing keys under NU6.3.
                        orchard.insert(
                            (account_id, scope),
                            Box::new(ScanningKey::<_, orchard::keys::FullViewingKey, _>::new(
                                ivk.clone(),
                                None,
                                account_id,
                                Some(scope),
                            )),
                        );
                        ironwood.insert(
                            (account_id, scope),
                            Box::new(ScanningKey::<_, orchard::keys::FullViewingKey, _>::new(
                                ivk.clone(),
                                None,
                                account_id,
                                Some(scope),
                            )),
                        );
                    }
                }
            }
        }
        ScanningKeys::new(sapling, orchard, ironwood)
    }

    async fn client(&self) -> Result<CompactTxStreamerClient<Channel>, String> {
        let mut ep = Channel::from_shared(self.endpoint.clone())
            .map_err(|e| format!("bad lightwalletd url: {}", e))?;
        if self.endpoint.starts_with("https://") {
            ep = ep
                .tls_config(
                    tonic::transport::ClientTlsConfig::new().with_enabled_roots(),
                )
                .map_err(|e| format!("tls config failed: {}", e))?;
        }
        let channel = ep
            .connect()
            .await
            .map_err(|e| format!("lightwalletd unreachable: {}", e))?;
        Ok(CompactTxStreamerClient::new(channel))
    }

    async fn tip(&self) -> Result<u32, String> {
        let mut c = self.client().await?;
        let id = c
            .get_latest_block(ChainSpec {})
            .await
            .map_err(|e| format!("get_latest_block failed: {}", e))?
            .into_inner();
        Ok(id.height as u32)
    }

    async fn fetch_block(&self, height: u32) -> Result<CompactBlock, String> {
        let mut c = self.client().await?;
        let mut stream = c
            .get_block_range(BlockRange {
                start: Some(BlockId {
                    height: height as u64,
                    hash: vec![],
                }),
                end: Some(BlockId {
                    height: height as u64,
                    hash: vec![],
                }),
                pool_types: vec![],
            })
            .await
            .map_err(|e| format!("get_block_range failed: {}", e))?
            .into_inner();
        stream
            .message()
            .await
            .map_err(|e| format!("stream failed: {}", e))?
            .ok_or_else(|| "empty block range".to_string())
    }

    /// Scan new blocks, emit events for payments on our addresses, and advance
    /// confirmation counts on pending payments.
    async fn poll_once(&self, state: &AppState) -> Result<(), String> {
        let tip = self.tip().await?;
        {
            let mut h = state.latest_height.lock().unwrap();
            if tip as u64 > *h {
                *h = tip as u64;
            }
        }

        // bump confirmations on pending payments — collect under lock, post after
        let to_post: Vec<(String, Event)> = {
            let mut pending = self.pending.lock().unwrap();
            let map = self.accounts.lock().unwrap();
            let mut out = vec![];
            let mut done = vec![];
            for (txid, p) in pending.iter_mut() {
                let conf = tip.saturating_sub(p.mined_height) + 1;
                if conf > p.last_conf {
                    p.last_conf = conf;
                    if let Some(a) = map.get(&p.account_id) {
                        out.push((
                            a.webhook_url.clone(),
                            Event {
                                event_id: format!("ev_{}", uuid::Uuid::new_v4().simple()),
                                typ: "payment.mined".into(),
                                invoice_id: None,
                                address: p.address.clone(),
                                txid: txid.clone(),
                                pool: p.pool.clone(),
                                output_index: p.output_index,
                                zats: p.zats,
                                memo_preview: None,
                                mined_height: Some(p.mined_height as u64),
                                confirmations: Some(conf),
                            },
                        ));
                    }
                    if conf >= state.confirmations_required {
                        done.push(txid.clone());
                    }
                }
            }
            for t in done {
                pending.remove(&t);
            }
            out
        };
        for (webhook, ev) in to_post {
            post_event(state, &webhook, ev).await;
        }

        // scan unscanned blocks
        let start = {
            let mut scanned = self.scanned_height.lock().unwrap();
            if *scanned == 0 {
                *scanned = tip.saturating_sub(200); // look back ~4h of regtest blocks on first run
            }
            let s = *scanned + 1;
            if tip >= s {
                *scanned = tip;
            }
            s
        };
        if start > tip {
            return Ok(());
        }

        let keys = self.scanning_keys();
        for height in start..=tip {
            let block = match self.fetch_block(height).await {
                Ok(b) => b,
                Err(e) => {
                    tracing::warn!("fetch block {} failed: {}", height, e);
                    continue;
                }
            };
            let scanned = scan_block::<_, u32, (u32, Scope), std::convert::Infallible>(
                &self.params,
                block,
                &keys,
                &SpendIdentifiers::empty(),
                None,
            )
            .map_err(|e| format!("scan_block failed: {:?}", e))?;

            for tx in scanned.transactions() {
                let txid_hex = format!("{}", tx.txid());
                let outputs: Vec<(String, u32, u64, [u8; 43])> = tx
                    .orchard_outputs()
                    .iter()
                    .map(|o| {
                        (
                            "orchard".to_string(),
                            o.index() as u32,
                            o.note().0.value().inner(),
                            o.note().0.recipient().to_raw_address_bytes(),
                        )
                    })
                    .chain(tx.ironwood_outputs().iter().map(|o| {
                        (
                            "ironwood".to_string(),
                            o.index() as u32,
                            o.note().0.value().inner(),
                            o.note().0.recipient().to_raw_address_bytes(),
                        )
                    }))
                    .collect();

                for (pool, output_index, zats, recipient) in outputs {
                    let hit = {
                        let map = self.accounts.lock().unwrap();
                        map.iter().find_map(|(id, a)| {
                            a.addresses
                                .get(&recipient)
                                .map(|(addr, _)| (id.clone(), addr.clone(), a.webhook_url.clone()))
                        })
                    };
                    let Some((account_id, address, webhook)) = hit else {
                        continue;
                    };
                    tracing::info!(
                        "payment found: {} zats → {} (tx {})",
                        zats,
                        &address[..address.len().min(18)],
                        txid_hex
                    );
                    // seen → mined
                    post_event(
                        state,
                        &webhook,
                        Event {
                            event_id: format!("ev_{}", uuid::Uuid::new_v4().simple()),
                            typ: "payment.detected".into(),
                            invoice_id: None,
                            address: address.clone(),
                            txid: txid_hex.clone(),
                            pool: pool.clone(),
                            output_index,
                            zats,
                            memo_preview: None,
                            mined_height: None,
                            confirmations: Some(0),
                        },
                    )
                    .await;
                    post_event(
                        state,
                        &webhook,
                        Event {
                            event_id: format!("ev_{}", uuid::Uuid::new_v4().simple()),
                            typ: "payment.mined".into(),
                            invoice_id: None,
                            address: address.clone(),
                            txid: txid_hex.clone(),
                            pool: pool.clone(),
                            output_index,
                            zats,
                            memo_preview: None,
                            mined_height: Some(height as u64),
                            confirmations: Some(1),
                        },
                    )
                    .await;
                    self.pending.lock().unwrap().insert(
                        txid_hex.clone(),
                        Pending {
                            account_id: account_id.clone(),
                            address,
                            zats,
                            pool,
                            output_index,
                            mined_height: height,
                            last_conf: 1,
                        },
                    );
                }
            }
        }
        Ok(())
    }

    /// Continuously poll the chain. Spun up once at startup in chain mode.
    pub async fn run(self: Arc<Self>, state: AppState) {
        loop {
            if let Err(e) = self.poll_once(&state).await {
                tracing::warn!("chain poll failed: {}", e);
            }
            tokio::time::sleep(Duration::from_secs(3)).await;
        }
    }
}

// `consensus` re-export used by params type inference in signatures above.
#[allow(dead_code)]
fn _params_ty<P: consensus::Parameters>(_: &P) {}

/// Network-selected scanner handle. `Parameters` isn't dyn-compatible, so the
/// network is chosen once at startup and carried as a concrete type.
pub enum ChainKind {
    Regtest(Arc<Chain<LocalNetwork>>),
    Testnet(Arc<Chain<TestNetwork>>),
    Mainnet(Arc<Chain<MainNetwork>>),
}

impl ChainKind {
    /// `network`: "regtest" | "testnet" | "mainnet" (default regtest for ths compat).
    pub fn new(network: &str, endpoint: String) -> Self {
        match network {
            "testnet" => Self::Testnet(Arc::new(Chain::new(TestNetwork, endpoint))),
            "mainnet" => Self::Mainnet(Arc::new(Chain::new(MainNetwork, endpoint))),
            _ => Self::Regtest(Arc::new(Chain::new(regtest_params(), endpoint))),
        }
    }

    pub fn import(&self, account_id: &str, ufvk: &str, webhook_url: &str) -> Result<(), String> {
        match self {
            Self::Regtest(c) => c.import(account_id, ufvk, webhook_url),
            Self::Testnet(c) => c.import(account_id, ufvk, webhook_url),
            Self::Mainnet(c) => c.import(account_id, ufvk, webhook_url),
        }
    }

    pub fn allocate(&self, account_id: &str, diversifier_index: u64) -> Result<String, String> {
        match self {
            Self::Regtest(c) => c.allocate(account_id, diversifier_index),
            Self::Testnet(c) => c.allocate(account_id, diversifier_index),
            Self::Mainnet(c) => c.allocate(account_id, diversifier_index),
        }
    }

    pub async fn run(self: Arc<Self>, state: AppState) {
        match self.as_ref() {
            Self::Regtest(c) => c.clone().run(state).await,
            Self::Testnet(c) => c.clone().run(state).await,
            Self::Mainnet(c) => c.clone().run(state).await,
        }
    }
}
