import { NextResponse } from "next/server";
import { db, workspace } from "@/lib/db";
import { passkeys, recoveryCodes } from "@zveil/db";
import { eq } from "drizzle-orm";

// List this workspace's passkeys + whether a recovery code exists.
export async function GET() {
  const ws = await workspace();
  const keys = await db()
    .select({ id: passkeys.id, name: passkeys.name, createdAt: passkeys.createdAt, lastUsedAt: passkeys.lastUsedAt, deviceType: passkeys.deviceType, backedUp: passkeys.backedUp })
    .from(passkeys)
    .where(eq(passkeys.workspaceId, ws.id));
  const [rc] = await db().select({ usedAt: recoveryCodes.usedAt }).from(recoveryCodes).where(eq(recoveryCodes.workspaceId, ws.id));
  return NextResponse.json({ passkeys: keys, recoveryAvailable: Boolean(rc && !rc.usedAt) });
}
