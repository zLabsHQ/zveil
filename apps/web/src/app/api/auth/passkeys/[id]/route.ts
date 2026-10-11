import { NextResponse } from "next/server";
import { db, workspace } from "@/lib/db";
import { passkeys } from "@zveil/db";
import { and, eq } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

// Remove a passkey from this workspace (scoped — can't touch other workspaces).
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const ws = await workspace();
  const rows = await db()
    .delete(passkeys)
    .where(and(eq(passkeys.id, id), eq(passkeys.workspaceId, ws.id)))
    .returning({ id: passkeys.id });
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
