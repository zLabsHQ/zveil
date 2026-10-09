import { NextResponse } from "next/server";
import { db, viewingKey, workspace } from "@/lib/db";
import { invoices, counters } from "@zveil/db";
import { eq, sql } from "drizzle-orm";
import { buildPaymentUri } from "@z-labs/zip321";
import { scanner } from "@/lib/scanner";
import { slug8 } from "@/lib/id";
import { emitInvoice } from "@/lib/bus";

type Ctx = { params: Promise<{ id: string }> };

async function nextCounter(key: string): Promise<number> {
  const [row] = await db()
    .insert(counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({ target: counters.key, set: { value: sql`${counters.value} + 1` } })
    .returning({ value: counters.value });
  return row.value;
}

export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [inv] = await db().select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inv.status !== "draft")
    return NextResponse.json({ error: "Invoice is already open" }, { status: 409 });
  if (inv.amountZats <= 0)
    return NextResponse.json({ error: "Invoice needs a positive amount" }, { status: 400 });

  const vk = await viewingKey();
  if (!vk) {
    return NextResponse.json(
      { error: "Connect a viewing key first (Settings → Payment detection)" },
      { status: 412 },
    );
  }

  const seq = await nextCounter("invoiceSeq");
  const diversifier = (await nextCounter(`diversifier:${vk.id}`)) - 1; // start at 0
  const memo = inv.memoSeed ?? `ZP-${seq}`;

  let address: string;
  try {
    const r = await scanner.allocateAddress(vk.scannerAccountId, diversifier);
    address = r.address;
  } catch (e) {
    if (process.env.DEMO_MODE === "1") {
      const { randomBytes } = await import("node:crypto");
      address = `uregtest1${randomBytes(40).toString("base64url").replace(/[^a-z0-9]/g, "q").toLowerCase()}${diversifier.toString(16)}`;
    } else {
      return NextResponse.json(
        { error: `Scanner could not derive an address: ${e instanceof Error ? e.message : "error"}` },
        { status: 502 },
      );
    }
  }

  const zip321 = buildPaymentUri([
    {
      address,
      amountZats: inv.amountZats,
      memoText: memo,
      message: `Invoice INV-${String(seq).padStart(4, "0")}`,
      label: (await workspace()).businessName,
    },
  ]);

  const slug = slug8();
  await db()
    .update(invoices)
    .set({
      status: "open",
      seq,
      slug,
      address,
      zip321Uri: zip321,
      diversifierIndex: diversifier,
      viewingKeyId: vk.id,
      confirmationsRequired: (await workspace()).defaultConfirmations,
      updatedAt: Date.now(),
    })
    .where(eq(invoices.id, id));

  emitInvoice({ invoiceId: id, slug, type: "status", status: "open" });
  return NextResponse.json({ ok: true, seq, slug, address, zip321Uri: zip321 });
}
