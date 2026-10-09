//! Dev tool: convert a ths printed "Unified spending key (hex)" into the UFVK
//! string the scanner imports, and show the default diversified address.
//!
//!   cargo run --example usk_to_ufvk -- <hex-usk>

use zcash_keys::keys::{Era, UnifiedAddressRequest, UnifiedSpendingKey};
use zcash_protocol::consensus::BlockHeight;
use zcash_protocol::local_consensus::LocalNetwork;

#[allow(unexpected_cfgs)]
fn params() -> LocalNetwork {
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

fn main() {
    let hex_key = std::env::args().nth(1).expect("usage: usk_to_ufvk <hex>");
    let bytes = hex::decode(hex_key.trim()).expect("invalid hex");
    let params = params();
    let usk = UnifiedSpendingKey::from_bytes(Era::Orchard, &bytes).expect("invalid USK");
    let ufvk = usk.to_unified_full_viewing_key();
    let uivk = ufvk.to_unified_incoming_viewing_key();
    println!("UFVK:\n{}", uivk.encode(&params).expect("encode failed"));
    let (ua, idx) = uivk
        .find_address(zip32::DiversifierIndex::new(), UnifiedAddressRequest::ALLOW_ALL)
        .expect("no address");
    println!("default address (diversifier {}): {}", u64::try_from(idx).unwrap_or(0), ua.encode(&params));
}
