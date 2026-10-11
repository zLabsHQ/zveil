import { NextResponse } from "next/server";
import { z } from "zod";
import { db, ownedInvoice } from "@/lib/db";
import { disclosures } from "@zveil/db";
import { disclosureToken, id } from "@/lib/id";

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({
  label: z.string().max(80).default("Viewer"),
  days: z.number().min(0.04).max(365).default(14),
});

export async function POST(req: Request, ctx: Ctx) {
  const { id: invoiceId } = await ctx.params;
  const inv = await ownedInvoice(invoiceId);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inv.status === "draft" || inv.status === "void")
    return NextResponse.json({ error: "Only sent invoices can be shared" }, { status: 409 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const token = disclosureToken();
  const now = Date.now();
  const d = {
    id: id(),
    invoiceId,
    token,
    label: parsed.data.label,
    expiresAt: now + parsed.data.days * 86_400_000,
    createdAt: now,
  };
  await db().insert(disclosures).values(d);
  return NextResponse.json({ disclosure: d, url: `/d/${token}` });
}
