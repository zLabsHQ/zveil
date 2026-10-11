import { connection } from "next/server";
import { publicKeyPem } from "@/lib/receipt";

// Zveil's Ed25519 public key (SPKI PEM) — lets anyone verify zv1 proofs offline.
// Rendered per request so it always matches the runtime signing key.
export async function GET() {
  await connection();
  return new Response(publicKeyPem(), {
    headers: { "content-type": "application/x-pem-file", "cache-control": "public, max-age=3600" },
  });
}
