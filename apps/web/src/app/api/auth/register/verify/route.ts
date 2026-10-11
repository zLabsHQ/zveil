import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { db, workspace } from "@/lib/db";
import { passkeys, recoveryCodes } from "@zveil/db";
import { eq } from "drizzle-orm";
import { hashRecovery, keyToB64, newRecoveryCode, rpConfig, takeChallenge } from "@/lib/auth";
import { id } from "@/lib/id";

// Finish passkey registration — stores the credential, binds it to this
// workspace, and (first time only) returns the one-time recovery code.
export async function POST(req: Request) {
  const chal = await takeChallenge("reg");
  if (!chal?.w) return NextResponse.json({ error: "Passkey ceremony expired — try again" }, { status: 400 });
  const ws = await workspace();
  if (ws.id !== chal.w) return NextResponse.json({ error: "Workspace changed mid-ceremony" }, { status: 400 });

  const { rpID, origin } = rpConfig(req);
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: await req.json(),
      expectedChallenge: chal.c,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Verification failed" }, { status: 400 });
  }
  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Passkey could not be verified" }, { status: 400 });
  }

  const cred = verification.registrationInfo.credential;
  const now = Date.now();
  const name = req.headers.get("user-agent")?.match(/Mac|Windows|iPhone|Android/i)?.[0] ?? "Passkey";
  await db().insert(passkeys).values({
    id: id(),
    workspaceId: ws.id,
    credentialId: cred.id,
    publicKey: keyToB64(cred.publicKey),
    counter: cred.counter,
    transports: cred.transports?.join(",") ?? null,
    deviceType: verification.registrationInfo.credentialDeviceType,
    backedUp: verification.registrationInfo.credentialBackedUp,
    name: `${name} passkey`,
    createdAt: now,
  });

  // First secured passkey → issue a recovery code (shown once).
  let recoveryCode: string | null = null;
  const [rc] = await db().select().from(recoveryCodes).where(eq(recoveryCodes.workspaceId, ws.id));
  if (!rc) {
    recoveryCode = newRecoveryCode();
    await db().insert(recoveryCodes).values({ workspaceId: ws.id, codeHash: hashRecovery(recoveryCode), createdAt: now });
  }
  return NextResponse.json({ ok: true, recoveryCode });
}
