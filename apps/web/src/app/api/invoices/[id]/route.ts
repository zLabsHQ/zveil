import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { invoices, payments, disclosures } from "@zveil/db";
import { eq, desc } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

const Patch = z.object({
  clientName: z.string().min(1).optional(),
  description: z.string().optional(),
  items: z.array(z.object({ description: z.string(), qty: z.number(), unitZats: z.number() })).optional(),
  amountZats: z.number().int().nonnegative().optional(),
  dueDate: z.number().nullable().optional(),
});

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [inv] = await db().select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const pays = await db()
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, id))
    .orderBy(desc(payments.seenAt));
  const links = await db().select().from(disclosures).where(eq(disclosures.invoiceId, id));
  return NextResponse.json({ invoice: inv, payments: pays, disclosures: links });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [inv] = await db().select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inv.status !== "draft")
    return NextResponse.json({ error: "Only drafts can be edited" }, { status: 409 });

  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid patch" }, { status: 400 });
  const b = parsed.data;
  await db()
    .update(invoices)
    .set({
      ...(b.clientName !== undefined && { clientName: b.clientName }),
      ...(b.description !== undefined && { description: b.description }),
      ...(b.items !== undefined && { itemsJson: JSON.stringify(b.items) }),
      ...(b.amountZats !== undefined && { amountZats: b.amountZats }),
      ...(b.dueDate !== undefined && { dueDate: b.dueDate }),
      updatedAt: Date.now(),
    })
    .where(eq(invoices.id, id));
  return NextResponse.json({ ok: true });
}
