import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { passkeys } from "@zveil/db";
import { eq } from "drizzle-orm";
import { b64ToKey, rpConfig, takeChallenge } from "@/lib/auth";
import { WS_COOKIE } from "@/lib/workspace-id";

// Verify a passkey assertion → point this browser's workspace cookie at the
// workspace that passkey unlocks.
export async function POST(req: Request) {
  const chal = await takeChallenge("auth");
  if (!chal) return NextResponse.json({ error: "Sign-in expired — try again" }, { status: 400 });

  const body = await req.json();
  const credentialId: string | undefined = body?.id;
  if (!credentialId) return NextResponse.json({ error: "Malformed assertion" }, { status: 400 });
  const [pk] = await db().select().from(passkeys).where(eq(passkeys.credentialId, credentialId)).limit(1);
  if (!pk) {
    return NextResponse.json(
      { error: "No Zveil workspace is secured by this passkey. Use a recovery code instead." },
      { status: 404 },
    );
  }

  const { rpID, origin } = rpConfig(req);
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: chal.c,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: { id: pk.credentialId, publicKey: b64ToKey(pk.publicKey), counter: pk.counter },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Verification failed" }, { status: 400 });
  }
  if (!verification.verified) return NextResponse.json({ error: "Passkey verification failed" }, { status: 401 });

  const now = Date.now();
  await db()
    .update(passkeys)
    .set({ counter: verification.authenticationInfo.newCounter, lastUsedAt: now })
    .where(eq(passkeys.id, pk.id));

  const res = NextResponse.json({ ok: true });
  res.cookies.set(WS_COOKIE, pk.workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}
