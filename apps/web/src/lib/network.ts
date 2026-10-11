// Testnet is the live network for every sandbox; mainnet ships after audit.
export const FAUCET_URL = "https://fauzec.com/";

export const NETWORKS = [
  { id: "testnet", label: "Zcash Testnet", unit: "TAZ", live: true, note: "Free test funds · live detection" },
  { id: "mainnet", label: "Zcash Mainnet", unit: "ZEC", live: false, note: "Launching after security audit" },
] as const;

export const unitFor = (network: string) => (network === "mainnet" ? "ZEC" : "TAZ");
