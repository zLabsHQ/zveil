// UFVK prefixes differ per network: uview1… (mainnet), uivktest1… (testnet).
// Catch wrong-network pastes before they reach the scanner, and translate the
// scanner's parser errors into words a person can act on.

export type UfvkCheck = { ok: true } | { ok: false; message: string };

export function checkUfvk(ufvk: string, network = "testnet"): UfvkCheck {
  const key = ufvk.trim();
  if (key.length < 32) return { ok: false, message: "That looks too short — paste the full Unified Full Viewing Key." };
  if (/^uview1/.test(key) && network === "testnet")
    return {
      ok: false,
      message:
        "That's a mainnet viewing key (uview1…) — Zveil is running on testnet. In your wallet, switch to testnet and export the UFVK that starts with uivktest1.",
    };
  if (/^uivktest1/.test(key) && network !== "testnet")
    return { ok: false, message: "That's a testnet viewing key (uivktest1…) but this workspace is on mainnet." };
  if (network === "testnet" && !key.startsWith("uivktest1"))
    return {
      ok: false,
      message: "Testnet UFVKs start with uivktest1. Export it from Zingo or Zashi in testnet mode → Settings → Show viewing key.",
    };
  if (network !== "testnet" && !key.startsWith("uview1"))
    return { ok: false, message: "Mainnet UFVKs start with uview1." };
  return { ok: true };
}

/** Turn a scanner import failure into a user-facing sentence. */
export function ufvkErrorMessage(raw: string, network = "testnet"): string {
  const prefix = /UnknownPrefix\("([a-z0-9]+)"\)/i.exec(raw)?.[1];
  if (prefix === "uview" && network === "testnet")
    return "That's a mainnet viewing key (uview1…) — Zveil is running on testnet. Testnet keys start with uivktest1.";
  if (prefix)
    return `The key's prefix "${prefix}" isn't valid on ${network} — check that you copied the UFVK from the right network.`;
  if (/invalid UFVK|parse/i.test(raw))
    return "That key couldn't be parsed — copy the full Unified Full Viewing Key (it starts with uivktest1 on testnet).";
  return raw;
}
