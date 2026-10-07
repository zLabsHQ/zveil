import { createPrivateKey, createPublicKey, sign as edSign, generateKeyPairSync } from "node:crypto";

// Platform Ed25519 signing key for receipts. Env: RECEIPT_PRIVATE_KEY (hex seed or PKCS8 PEM).
// For dev, a throwaway key is generated once per process if unset.
let _key: { privateKey: ReturnType<typeof createPrivateKey>; publicKeyPem: string } | null = null;

function key() {
  if (_key) return _key;
  const seed = process.env.RECEIPT_PRIVATE_KEY;
  if (seed) {
    const privateKey = createPrivateKey({ key: Buffer.from(seed, "hex"), format: "der", type: "pkcs8" });
    const publicKeyPem = createPublicKey(privateKey).export({ format: "pem", type: "spki" }).toString();
    _key = { privateKey, publicKeyPem };
  } else {
    const kp = generateKeyPairSync("ed25519");
    _key = {
      privateKey: kp.privateKey,
      publicKeyPem: kp.publicKey.export({ format: "pem", type: "spki" }).toString(),
    };
  }
  return _key;
}

export interface ReceiptPayload {
  invoice: string;
  paid_at: string;
  zats: number;
  fiat?: string;
  txids: string[];
  recipient: string;
}

export function signReceipt(payload: ReceiptPayload): { signature: string; publicKey: string } {
  const canonical = [
    `zveil-receipt-v1`,
    `invoice:${payload.invoice}`,
    `paid_at:${payload.paid_at}`,
    `zats:${payload.zats}`,
    `fiat:${payload.fiat ?? ""}`,
    `txids:${payload.txids.join(",")}`,
    `recipient:${payload.recipient}`,
  ].join("\n");
  const sig = edSign(null, Buffer.from(canonical, "utf8"), key().privateKey);
  return { signature: sig.toString("base64"), publicKey: key().publicKeyPem };
}
