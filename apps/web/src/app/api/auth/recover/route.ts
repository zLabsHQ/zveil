import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recoveryCodes } from "@zveil/db";
import { and, eq, isNull } from "drizzle-orm";
import { hashRecovery } from "@/lib/auth";
import { WS_COOKIE } from "@/lib/workspace-id";

// Recover a workspace with its one-time recovery code. The code is consumed —
// a fresh one is issued next time a passkey is added or regenerated.
export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({}));
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "Enter your recovery code" }, { status: 400 });
  }
  const hash = hashRecovery(code);
  const [match] = await db()
    .select()
    .from(recoveryCodes)
    .where(and(eq(recoveryCodes.codeHash, hash), isNull(recoveryCodes.usedAt)))
    .limit(1);
  if (!match) {
    return NextResponse.json({ error: "That recovery code isn't valid — check it and try again" }, { status: 401 });
  }

  await db().update(recoveryCodes).set({ usedAt: Date.now() }).where(eq(recoveryCodes.workspaceId, match.workspaceId));
  const res = NextResponse.json({ ok: true });
  res.cookies.set(WS_COOKIE, match.workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}
