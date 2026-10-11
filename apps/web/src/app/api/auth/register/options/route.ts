import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { db, workspace } from "@/lib/db";
import { passkeys } from "@zveil/db";
import { eq } from "drizzle-orm";
import { rpConfig, RP_NAME, setChallenge } from "@/lib/auth";

// Start passkey registration for the current workspace.
export async function POST(req: Request) {
  const ws = await workspace();
  const existing = await db()
    .select({ credentialId: passkeys.credentialId })
    .from(passkeys)
    .where(eq(passkeys.workspaceId, ws.id));
  const { rpID } = rpConfig(req);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: ws.businessName,
    userID: new TextEncoder().encode(ws.id),
    userDisplayName: ws.businessName,
    attestationType: "none",
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
    excludeCredentials: existing.map((k) => ({ id: k.credentialId })),
  });
  await setChallenge("reg", options.challenge, ws.id);
  return NextResponse.json(options);
}
