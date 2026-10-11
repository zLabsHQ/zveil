import { createPrivateKey, createPublicKey, generateKeyPairSync, sign as edSign, verify as edVerify, type KeyObject } from "node:crypto";

// Zveil-signed proofs (receipts and income statements).
//
// A proof is a portable code: `zv1.<base64url(JSON payload)>.<base64url(Ed25519 signature)>`.
// The signature covers `zveil-proof-v1.<payload segment>`, so anyone with Zveil's public key
// (GET /api/proofs/key) can verify it offline — the proof stays checkable even without Zveil.
//
// Signing key: RECEIPT_PRIVATE_KEY (PKCS8 DER, hex). Dev falls back to a per-process key.

let _key: { privateKey: KeyObject; publicKey: KeyObject } | null = null;

function key() {
  if (_key) return _key;
  const hex = process.env.RECEIPT_PRIVATE_KEY;
  if (hex) {
    const privateKey = createPrivateKey({ key: Buffer.from(hex, "hex"), format: "der", type: "pkcs8" });
    _key = { privateKey, publicKey: createPublicKey(privateKey) };
  } else {
    const kp = generateKeyPairSync("ed25519");
    _key = { privateKey: kp.privateKey, publicKey: kp.publicKey };
  }
  return _key;
}

export const publicKeyPem = () => key().publicKey.export({ format: "pem", type: "spki" }).toString();

interface ProofBase {
  v: 1;
  network: string;
  recipient: string; // business name shown on the proof
  zats: number;
  txids: string[];
  sample?: boolean; // contains sandbox sample data
}

export interface ReceiptProof extends ProofBase {
  t: "receipt";
  invoice: string; // INV-0001
  paidAt: string; // ISO
  fiat?: string; // "USD 120.00"
}

export interface StatementProof extends ProofBase {
  t: "statement";
  from: string; // ISO date (inclusive)
  to: string; // ISO date (inclusive)
  count: number;
  usdCents: number | null; // USD value at time received, when known for every payment
}

export type Proof = ReceiptProof | StatementProof;

const PREFIX = "zv1";
const message = (payloadSeg: string) => Buffer.from(`zveil-proof-v1.${payloadSeg}`, "utf8");

export function signProof(proof: Proof): string {
  const payloadSeg = Buffer.from(JSON.stringify(proof), "utf8").toString("base64url");
  const sig = edSign(null, message(payloadSeg), key().privateKey).toString("base64url");
  return `${PREFIX}.${payloadSeg}.${sig}`;
}

export type VerifyResult = { ok: true; proof: Proof } | { ok: false; reason: string };

export function verifyProof(code: string): VerifyResult {
  const parts = code.trim().split(".");
  if (parts.length !== 3 || parts[0] !== PREFIX) return { ok: false, reason: "Not a Zveil proof code (expected zv1.…)." };
  const [, payloadSeg, sigSeg] = parts;
  let valid = false;
  try {
    valid = edVerify(null, message(payloadSeg), key().publicKey, Buffer.from(sigSeg, "base64url"));
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, reason: "Signature does not match — this proof was altered or not issued by Zveil." };
  try {
    const proof = JSON.parse(Buffer.from(payloadSeg, "base64url").toString("utf8")) as Proof;
    if (proof.v !== 1 || (proof.t !== "receipt" && proof.t !== "statement")) throw new Error();
    return { ok: true, proof };
  } catch {
    return { ok: false, reason: "Proof payload is unreadable." };
  }
}
