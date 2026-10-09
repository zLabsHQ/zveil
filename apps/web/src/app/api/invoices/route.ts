import { NextResponse } from "next/server";
import { z } from "zod";
import { db, workspace } from "@/lib/db";
import { invoices, payments } from "@zveil/db";
import { desc, eq } from "drizzle-orm";
import { id, memoSeed } from "@/lib/id";

const LineItem = z.object({ description: z.string(), qty: z.number(), unitZats: z.number() });

const Body = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().optional().or(z.literal("")),
  description: z.string().default(""),
  items: z.array(LineItem).default([]),
  amountZats: z.number().int().nonnegative(),
  amountFiatCents: z.number().int().positive().optional(),
  fiat: z.string().optional(),
  rateFiatPerZec: z.number().optional(),
  dueDate: z.number().optional(),
});

export async function GET() {
  const ws = await workspace();
  const rows = await db()
    .select()
    .from(invoices)
    .where(eq(invoices.workspaceId, ws.id))
    .orderBy(desc(invoices.createdAt));
  const pays = await db().select().from(payments);
  const paidByInvoice = new Map<string, number>();
  for (const p of pays) {
    if (p.reorgedAt) continue;
    paidByInvoice.set(p.invoiceId, (paidByInvoice.get(p.invoiceId) ?? 0) + p.zats);
  }
  return NextResponse.json({
    invoices: rows.map((i) => ({ ...i, paidZats: paidByInvoice.get(i.id) ?? 0 })),
  });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice", issues: parsed.error.issues }, { status: 400 });
  }
  const b = parsed.data;
  const now = Date.now();
  const inv = {
    id: id(),
    workspaceId: (await workspace()).id,
    status: "draft",
    clientName: b.clientName,
    clientEmail: b.clientEmail || null,
    description: b.description,
    itemsJson: JSON.stringify(b.items),
    amountZats: b.amountZats,
    fiat: b.fiat ?? null,
    amountFiatCents: b.amountFiatCents ?? null,
    rateFiatPerZec: b.rateFiatPerZec ?? null,
    dueDate: b.dueDate ?? null,
    memoSeed: memoSeed(),
    createdAt: now,
    updatedAt: now,
  };
  await db().insert(invoices).values(inv);
  return NextResponse.json({ invoice: inv });
}
