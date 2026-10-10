//! Dev tool: generate a fresh testnet identity for the live demo.
//! Prints the seed (KEEP — recovers the wallet), the UFVK the scanner imports,
//! and the default unified address to fund from a testnet faucet.
//!
//!   cargo run --example gen_testnet_ufvk              # fresh random seed
//!   cargo run --example gen_testnet_ufvk -- <hex-64B> # reproduce from a seed

use zcash_keys::keys::{UnifiedAddressRequest, UnifiedSpendingKey};
use zcash_protocol::consensus::TestNetwork;

fn main() {
    let seed: [u8; 64] = match std::env::args().nth(1) {
        Some(h) => {
            let b = hex::decode(h.trim()).expect("invalid hex seed");
            b.try_into().expect("seed must be 64 bytes")
        }
        None => {
            let mut s = [0u8; 64];
            rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut s);
            s
        }
    };
    let params = TestNetwork;
    let usk = UnifiedSpendingKey::from_seed(&params, &seed, zip32::AccountId::ZERO)
        .expect("derive failed");
    let ufvk = usk.to_unified_full_viewing_key();
    let uivk = ufvk.to_unified_incoming_viewing_key();
    println!("seed (hex, keep secret):\n{}", hex::encode(seed));
    println!("\nUFVK (import into scanner):\n{}", uivk.encode(&params).expect("encode failed"));
    let (ua, idx) = uivk
        .find_address(zip32::DiversifierIndex::new(), UnifiedAddressRequest::ALLOW_ALL)
        .expect("no address");
    println!("\ndefault testnet address (diversifier {}):\n{}", u64::try_from(idx).unwrap_or(0), ua.encode(&params));
}
