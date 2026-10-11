//! Zveil scanner — non-custodial payment detection service.
//!
//! Responsibilities:
//!   1. Import a Unified Full Viewing Key → scanner account (view-only; never spends).
//!   2. Allocate per-invoice diversified shielded addresses.
//!   3. Emit signed webhook events: payment.detected → payment.mined → payment.reorged.
//!
//! Modes:
//!   - `chain`  (SCANNER_MODE=chain): real view-only scanning against
//!              lightwalletd/Zaino via zcash_client_backend — UFVK decode, real
//!              diversified addresses, trial-decrypt of compact blocks
//!              (Orchard + Ironwood). See src/chain.rs. Needs LIGHTWALLETD_URL.
//!   - `demo`   (default): validates UFVK shape, allocates deterministic-looking
//!              regtest addresses, and /v1/demo/pay fabricates the full detected→
//!              mined→confirmed event lifecycle through the same signed webhook path.
//!              The web app cannot tell the difference — same signatures, same payloads.
//!
//! Env:
//!   PORT                    (default 8080)
//!   SCANNER_MODE            "demo" (default) | "chain"
//!   LIGHTWALLETD_URL        lightwalletd/Zaino gRPC endpoint (default http://localhost:9067)
//!   SCANNER_TOKEN           Bearer token for web↔scanner auth (default "dev-token")
//!   SCANNER_WEBHOOK_SECRET  HMAC-SHA256 key for event signatures (default "dev-secret")
//!   CONFIRMATIONS_REQUIRED  (default 3)

use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::Json,
    routing::{get, post},
    Router,
};
use hmac::{Hmac, Mac};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::Duration,
};
use uuid::Uuid;

mod chain;
use chain::ChainKind;

type HmacSha256 = Hmac<Sha256>;

// ---------------------------------------------------------------- state

struct Account {
    #[allow(dead_code)]
    id: String,
    #[allow(dead_code)]
    fingerprint: String,
    #[allow(dead_code)]
    network: String,
    #[allow(dead_code)]
    ufvk: String,
    webhook_url: String,
    next_diversifier: u64,
}

#[derive(Clone)]
struct AppState {
    token: String,
    webhook_secret: String,
    confirmations_required: u32,
    accounts: Arc<Mutex<HashMap<String, Account>>>,
    http: reqwest::Client,
    latest_height: Arc<Mutex<u64>>,
    mode: String,
    network: String,
    chain: Option<Arc<ChainKind>>,
}

// ---------------------------------------------------------------- types

#[derive(Deserialize)]
struct ImportBody {
    ufvk: String,
    #[serde(rename = "webhookUrl")]
    webhook_url: String,
    /// Optional caller-chosen id. Re-importing the same id is idempotent and
    /// keeps already-allocated addresses watched.
    #[serde(rename = "accountId", default)]
    account_id: Option<String>,
}

#[derive(Serialize)]
struct ImportResp {
    #[serde(rename = "accountId")]
    account_id: String,
    fingerprint: String,
    network: String,
}

#[derive(Deserialize)]
struct AllocBody {
    #[serde(rename = "diversifierIndex")]
    diversifier_index: u64,
}

#[derive(Serialize)]
struct AllocResp {
    address: String,
    #[serde(rename = "diversifierIndex")]
    diversifier_index: u64,
}

#[derive(Deserialize)]
struct DemoPayBody {
    #[serde(rename = "invoiceId")]
    invoice_id: String,
    address: String,
    zats: u64,
    #[serde(default)]
    #[allow(dead_code)]
    partial: bool,
}

#[derive(Serialize)]
struct StatusResp {
    ok: bool,
    network: String,
    #[serde(rename = "latestHeight")]
    latest_height: u64,
    #[serde(rename = "syncedHeight")]
    synced_height: u64,
    accounts: usize,
    mode: String,
}

#[derive(Serialize, Clone)]
struct Event {
    #[serde(rename = "eventId")]
    event_id: String,
    #[serde(rename = "type")]
    typ: String,
    #[serde(rename = "invoiceId", skip_serializing_if = "Option::is_none")]
    invoice_id: Option<String>,
    address: String,
    txid: String,
    pool: String,
    #[serde(rename = "outputIndex")]
    output_index: u32,
    zats: u64,
    #[serde(rename = "memoPreview", skip_serializing_if = "Option::is_none")]
    memo_preview: Option<String>,
    #[serde(rename = "minedHeight", skip_serializing_if = "Option::is_none")]
    mined_height: Option<u64>,
    #[serde(rename = "confirmations", skip_serializing_if = "Option::is_none")]
    confirmations: Option<u32>,
}

// ---------------------------------------------------------------- events

fn sign_event(secret: &str, body: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap();
    mac.update(body.as_bytes());
    format!("sha256={}", hex::encode(mac.finalize().into_bytes()))
}

async fn post_event(state: &AppState, webhook_url: &str, ev: Event) {
    let body = serde_json::to_string(&ev).unwrap();
    let sig = sign_event(&state.webhook_secret, &body);
    let res = state
        .http
        .post(webhook_url)
        .header("content-type", "application/json")
        .header("x-zveil-signature", sig)
        .body(body)
        .send()
        .await;
    if let Err(e) = res {
        tracing::warn!("webhook delivery failed for {}: {}", ev.event_id, e);
    }
}

fn hex_txid() -> String {
    let mut b = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut b);
    hex::encode(b)
}

fn fingerprint_of(ufvk: &str) -> String {
    hex::encode(Sha256::digest(ufvk.as_bytes()))[..16].to_string()
}

fn demo_address(diversifier: u64) -> String {
    let mut b = [0u8; 40];
    rand::thread_rng().fill_bytes(&mut b);
    let tail: String = b
        .iter()
        .map(|x| b"qpzry9x8gf2tvdw0s3jn54khce6mua7l"[(x % 32) as usize] as char)
        .collect();
    format!("uregtest1{}{:x}", tail, diversifier)
}

// ---------------------------------------------------------------- auth

fn auth<'a>(
    state: &AppState,
    headers: &'a HeaderMap,
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    let ok = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .map(|v| v == format!("Bearer {}", state.token))
        .unwrap_or(false);
    if ok {
        Ok(())
    } else {
        Err((
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "error": "unauthorized" })),
        ))
    }
}

// ---------------------------------------------------------------- handlers

async fn status(
    State(s): State<AppState>,
    h: HeaderMap,
) -> Result<Json<StatusResp>, (StatusCode, Json<serde_json::Value>)> {
    auth(&s, &h)?;
    let height = *s.latest_height.lock().unwrap();
    Ok(Json(StatusResp {
        ok: true,
        network: s.network.clone(),
        latest_height: height,
        synced_height: height,
        accounts: s.accounts.lock().unwrap().len(),
        mode: s.mode.clone(),
    }))
}

async fn import_account(
    State(s): State<AppState>,
    h: HeaderMap,
    Json(b): Json<ImportBody>,
) -> Result<Json<ImportResp>, (StatusCode, Json<serde_json::Value>)> {
    auth(&s, &h)?;
    if b.ufvk.len() < 32 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "invalid UFVK" })),
        ));
    }
    let id = b
        .account_id
        .clone()
        .filter(|v| !v.is_empty() && v.len() <= 64 && v.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-'))
        .unwrap_or_else(|| format!("acct_{}", Uuid::new_v4().simple()));
    if let Some(chain) = &s.chain {
        chain.import(&id, &b.ufvk, &b.webhook_url).map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": e })),
            )
        })?;
    }
    let fp = fingerprint_of(&b.ufvk);
    let acct = Account {
        id: id.clone(),
        fingerprint: fp.clone(),
        network: s.network.clone(),
        ufvk: b.ufvk.clone(),
        webhook_url: b.webhook_url,
        next_diversifier: 0,
    };
    s.accounts
        .lock()
        .unwrap()
        .entry(id.clone())
        .and_modify(|a| a.webhook_url = acct.webhook_url.clone())
        .or_insert(acct);
    tracing::info!("imported account {} (fp {})", id, fp);
    Ok(Json(ImportResp {
        account_id: id,
        fingerprint: fp,
        network: s.network.clone(),
    }))
}

async fn allocate_address(
    State(s): State<AppState>,
    Path(acct_id): Path<String>,
    h: HeaderMap,
    Json(b): Json<AllocBody>,
) -> Result<Json<AllocResp>, (StatusCode, Json<serde_json::Value>)> {
    auth(&s, &h)?;
    let mut map = s.accounts.lock().unwrap();
    let acct = map.get_mut(&acct_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(serde_json::json!({ "error": "account not found" })),
    ))?;
    acct.next_diversifier = acct.next_diversifier.max(b.diversifier_index + 1);
    let address = if let Some(chain) = &s.chain {
        chain.allocate(&acct_id, b.diversifier_index).map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": e })),
            )
        })?
    } else {
        demo_address(b.diversifier_index)
    };
    Ok(Json(AllocResp {
        address,
        diversifier_index: b.diversifier_index,
    }))
}

async fn demo_pay(
    State(s): State<AppState>,
    h: HeaderMap,
    Json(b): Json<DemoPayBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    auth(&s, &h)?;
    // find the webhook for this address's account (demo: use first account's webhook)
    let webhook = {
        let map = s.accounts.lock().unwrap();
        map.values().next().map(|a| a.webhook_url.clone()).ok_or((
            StatusCode::PRECONDITION_FAILED,
            Json(serde_json::json!({ "error": "import a viewing key first" })),
        ))?
    };
    let zats = b.zats;
    let required = s.confirmations_required;
    let state = s.clone();
    tokio::spawn(async move {
        let txid = hex_txid();
        // 1. mempool detection
        post_event(
            &state,
            &webhook,
            Event {
                event_id: format!("ev_{}", Uuid::new_v4().simple()),
                typ: "payment.detected".into(),
                invoice_id: Some(b.invoice_id.clone()),
                address: b.address.clone(),
                txid: txid.clone(),
                pool: "ironwood".into(),
                output_index: 0,
                zats,
                memo_preview: Some("ZP-DEMO".into()),
                mined_height: None,
                confirmations: Some(0),
            },
        )
        .await;
        // 2. mined + confirmations 1..required
        for c in 1..=required {
            tokio::time::sleep(Duration::from_millis(800)).await;
            {
                let mined = {
                    let mut h = state.latest_height.lock().unwrap();
                    *h += 1;
                    *h
                };
                post_event(
                    &state,
                    &webhook,
                    Event {
                        event_id: format!("ev_{}", Uuid::new_v4().simple()),
                        typ: "payment.mined".into(),
                        invoice_id: Some(b.invoice_id.clone()),
                        address: b.address.clone(),
                        txid: txid.clone(),
                        pool: "ironwood".into(),
                        output_index: 0,
                        zats,
                        memo_preview: None,
                        mined_height: Some(mined),
                        confirmations: Some(c),
                    },
                )
                .await;
            }
        }
    });
    Ok(Json(serde_json::json!({ "ok": true })))
}

// ---------------------------------------------------------------- main

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // SCANNER_MODE=chain requires LIGHTWALLETD_URL (e.g. http://localhost:9067).
    // ZCASH_NETWORK picks consensus params: regtest (ths) | testnet | mainnet.
    let mode = std::env::var("SCANNER_MODE").unwrap_or_else(|_| "demo".into());
    let network = std::env::var("ZCASH_NETWORK").unwrap_or_else(|_| "regtest".into());
    let chain = if mode == "chain" {
        let endpoint =
            std::env::var("LIGHTWALLETD_URL").unwrap_or_else(|_| "http://localhost:9067".into());
        let network = network.clone();
        tracing::info!("chain mode: {} via {}", network, endpoint);
        Some(Arc::new(ChainKind::new(&network, endpoint)))
    } else {
        None
    };

    let state = AppState {
        token: std::env::var("SCANNER_TOKEN").unwrap_or_else(|_| "dev-token".into()),
        webhook_secret: std::env::var("SCANNER_WEBHOOK_SECRET")
            .unwrap_or_else(|_| "dev-secret".into()),
        confirmations_required: std::env::var("CONFIRMATIONS_REQUIRED")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(3),
        accounts: Arc::new(Mutex::new(HashMap::new())),
        http: reqwest::Client::new(),
        latest_height: Arc::new(Mutex::new(3_512_000)),
        mode: mode.clone(),
        network,
        chain: chain.clone(),
    };

    // Real chain polling loop — only when running against lightwalletd/Zaino.
    if let Some(c) = chain {
        let st = state.clone();
        tokio::spawn(async move { c.run(st).await });
    }
    let app = Router::new()
        .route("/v1/status", get(status))
        .route("/v1/accounts", post(import_account))
        .route("/v1/accounts/{acct}/addresses", post(allocate_address))
        .route("/v1/demo/pay", post(demo_pay))
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".into());
    let addr = format!("0.0.0.0:{}", port);
    tracing::info!("zveil-scanner listening on {} (mode={})", addr, mode);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
