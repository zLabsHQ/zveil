import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@zveil/db";
import { eq } from "drizzle-orm";
import { emitInvoice } from "@/lib/bus";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const inv = db().select().from(invoices).where(eq(invoices.id, id)).get();
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inv.status === "paid")
    return NextResponse.json({ error: "Paid invoices cannot be voided" }, { status: 409 });
  db().update(invoices).set({ status: "void", updatedAt: Date.now() }).where(eq(invoices.id, id)).run();
  emitInvoice({ invoiceId: id, slug: inv.slug ?? undefined, type: "status", status: "void" });
  return NextResponse.json({ ok: true });
}
