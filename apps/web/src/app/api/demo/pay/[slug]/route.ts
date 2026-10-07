import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { invoices, payments } from "@zveil/db";
import { eq } from "drizzle-orm";
import { reconcile } from "@/lib/reconcile";
import { emitInvoice } from "@/lib/bus";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

const Body = z.object({
  zats: z.number().int().positive().optional(),
  partial: z.boolean().default(false),
});

// Demo harness (enabled when DEMO_MODE=1): simulates a payer's wallet —
// inserts a detected payment, then mines it, then bumps confirmations.
// Runs through the exact same DB + reconcile + SSE path as real events.
export async function POST(req: Request, ctx: Ctx) {
  if (process.env.DEMO_MODE !== "1") {
    return NextResponse.json({ error: "Demo mode disabled" }, { status: 404 });
  }
  const { slug } = await ctx.params;
  const inv = db().select().from(invoices).where(eq(invoices.slug, slug)).get();
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inv.status === "void" || inv.status === "draft")
    return NextResponse.json({ error: "Invoice not payable" }, { status: 409 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : { partial: false };
  const paid = sumPaid(inv.id);
  const remaining = Math.max(inv.amountZats - paid, 1);
  const zats = body.zats ?? (body.partial ? Math.floor(inv.amountZats * 0.4) : remaining);

  const txid = randomBytes(32).toString("hex");
  const paymentId = `${txid}:ironwood:0`;
  const now = Date.now();
  db()
    .insert(payments)
    .values({
      id: paymentId,
      invoiceId: inv.id,
      txid,
      pool: "ironwood",
      outputIndex: 0,
      zats,
      memoPreview: inv.memoSeed,
      confirmations: 0,
      seenAt: now,
    })
    .run();
  emitInvoice({ invoiceId: inv.id, slug, type: "payment", payment: { txid, zats, pool: "ironwood", confirmations: 0 } });
  reconcile(inv.id);

  // simulate chain: mined at +900ms, then confirmations 2,3 at +600ms steps
  const steps = [1, 2, inv.confirmationsRequired];
  steps.forEach((c, i) => {
    setTimeout(() => {
      db().update(payments)
        .set({ minedHeight: 3_512_000 + c, confirmations: c })
        .where(eq(payments.id, paymentId))
        .run();
      emitInvoice({ invoiceId: inv.id, slug, type: "payment", payment: { txid, zats, pool: "ironwood", confirmations: c } });
      reconcile(inv.id);
    }, 900 + i * 650);
  });

  return NextResponse.json({ ok: true, txid, zats });
}

function sumPaid(invoiceId: string): number {
  const rows = db().select({ zats: payments.zats }).from(payments).where(eq(payments.invoiceId, invoiceId)).all();
  return rows.reduce((s, r) => s + r.zats, 0);
}
