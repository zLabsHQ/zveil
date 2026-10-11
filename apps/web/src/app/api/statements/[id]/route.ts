import { NextResponse } from "next/server";
import { db, workspace } from "@/lib/db";
import { disclosures } from "@zveil/db";
import { and, eq } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

// Revoke a statement link — the URL stops working immediately.
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const ws = await workspace();
  const rows = await db()
    .update(disclosures)
    .set({ revokedAt: Date.now() })
    .where(and(eq(disclosures.id, id), eq(disclosures.workspaceId, ws.id), eq(disclosures.kind, "statement")))
    .returning({ id: disclosures.id });
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
