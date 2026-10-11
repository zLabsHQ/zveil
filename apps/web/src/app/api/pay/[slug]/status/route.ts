import { NextResponse } from "next/server";
import { db, paymentsFor } from "@/lib/db";
import { invoices } from "@zveil/db";
import { eq } from "drizzle-orm";

type Ctx = { params: Promise<{ slug: string }> };

// Public, payer-facing status for the hosted pay page — exposes only what the
// pay page already shows (status, amount received, confirmations).
export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const [inv] = await db()
    .select({ id: invoices.id, status: invoices.status })
    .from(invoices)
    .where(eq(invoices.slug, slug))
    .limit(1);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const pays = await paymentsFor([inv.id]);
  return NextResponse.json({
    status: inv.status,
    paidZats: pays.reduce((s, p) => s + p.zats, 0),
    confirmations: pays.reduce((m, p) => Math.max(m, p.confirmations), 0),
  });
}
