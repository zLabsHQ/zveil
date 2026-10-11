import { NextResponse } from "next/server";
import { db, workspace } from "@/lib/db";
import { recoveryCodes } from "@zveil/db";
import { eq } from "drizzle-orm";
import { hashRecovery, newRecoveryCode } from "@/lib/auth";

// Rotate the workspace recovery code — returns the new code once.
export async function POST() {
  const ws = await workspace();
  const code = newRecoveryCode();
  await db().delete(recoveryCodes).where(eq(recoveryCodes.workspaceId, ws.id));
  await db().insert(recoveryCodes).values({
    workspaceId: ws.id,
    codeHash: hashRecovery(code),
    createdAt: Date.now(),
  });
  return NextResponse.json({ code });
}
