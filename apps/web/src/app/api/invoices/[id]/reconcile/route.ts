import { NextResponse } from "next/server";
import { z } from "zod";
import { db, ownedInvoice } from "@/lib/db";
import { invoices } from "@zveil/db";
import { eq } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({ note: z.string().trim().max(500).default(""), reopen: z.boolean().default(false) });

// Resolve (or reopen) a reconciliation exception with an audit note.
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const inv = await ownedInvoice(id);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { note, reopen } = parsed.data;
  await db()
    .update(invoices)
    .set(
      reopen
        ? { reconResolvedAt: null, reconNote: null, updatedAt: Date.now() }
        : { reconResolvedAt: Date.now(), reconNote: note || null, updatedAt: Date.now() },
    )
    .where(eq(invoices.id, id));
  return NextResponse.json({ ok: true });
}
