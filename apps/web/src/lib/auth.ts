import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * WebAuthn / passkey support.
 *
 * - Relying party config derives from WEB_BASE_URL so dev and prod both work
 *   with zero extra env (override with WEBAUTHN_RP_ID / WEBAUTHN_ORIGIN).
 * - The WebAuthn challenge travels in a short-lived, HMAC-signed httpOnly
 *   cookie — stateless, no challenge table needed.
 * - Each workspace gets a one-time recovery code (only its SHA-256 hash is
 *   stored) as a fallback when passkeys aren't available.
 */

export const RP_NAME = "Zveil";

export function rpConfig(req: Request) {
  // RP ID must equal the effective domain — derive it from the request so the
  // same code works on localhost, preview URLs and prod with zero config.
  const base = process.env.WEBAUTHN_ORIGIN ?? new URL(req.url).origin;
  return {
    rpID: process.env.WEBAUTHN_RP_ID ?? new URL(base).hostname,
    origin: base,
  };
}

const secret = () =>
  process.env.AUTH_SECRET ??
  process.env.RECEIPT_PRIVATE_KEY ??
  process.env.SCANNER_WEBHOOK_SECRET ??
  "zveil-dev-secret";

// --- challenge cookie -------------------------------------------------------

const CHAL_COOKIE = "zv_wa";
const CHAL_TTL_MS = 5 * 60 * 1000;

type Challenge = { k: "reg" | "auth"; c: string; w?: string; e: number };

const b64u = (buf: Buffer | string) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromB64u = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

function sign(payload: string) {
  return b64u(createHmac("sha256", secret()).update(payload).digest());
}

export async function setChallenge(kind: Challenge["k"], challenge: string, workspaceId?: string) {
  const payload: Challenge = { k: kind, c: challenge, e: Date.now() + CHAL_TTL_MS, ...(workspaceId ? { w: workspaceId } : {}) };
  const p = b64u(JSON.stringify(payload));
  const jar = await cookies();
  jar.set(CHAL_COOKIE, `${p}.${sign(p)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CHAL_TTL_MS / 1000,
  });
}

export async function takeChallenge(kind: Challenge["k"]): Promise<Challenge | null> {
  const jar = await cookies();
  const raw = jar.get(CHAL_COOKIE)?.value;
  if (raw) jar.delete(CHAL_COOKIE); // single-use
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const p = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expect = sign(p);
  if (sig.length !== expect.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const chal = JSON.parse(fromB64u(p).toString()) as Challenge;
    if (chal.k !== kind || chal.e < Date.now()) return null;
    return chal;
  } catch {
    return null;
  }
}

// --- recovery code ----------------------------------------------------------

/** `zv-XXXX-XXXX-XXXX` — 60 bits of entropy, typeable. */
export function newRecoveryCode() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789"; // no i/l/o/0/1 confusion
  const bytes = randomBytes(12);
  const s = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
  return `zv-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

export function hashRecovery(code: string) {
  return createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
}

// --- base64url for stored keys ----------------------------------------------

export const keyToB64 = (key: Uint8Array) => b64u(Buffer.from(key));
export const b64ToKey = (s: string) => new Uint8Array(fromB64u(s));
