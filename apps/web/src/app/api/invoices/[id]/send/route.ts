import { NextResponse } from "next/server";
import { db, viewingKey, workspace } from "@/lib/db";
import { invoices, counters } from "@zveil/db";
import { eq } from "drizzle-orm";
import { buildPaymentUri } from "@zveil/zip321";
import { scanner } from "@/lib/scanner";
import { slug8 } from "@/lib/id";
import { emitInvoice } from "@/lib/bus";

type Ctx = { params: Promise<{ id: string }> };

function nextCounter(key: string): number {
  db()
    .insert(counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({ target: counters.key, set: { value: counters.value } })
    .run();
  // sqlite lacks RETURNING in this path reliably — read after bump:
  return db().select().from(counters).where(eq(counters.key, key)).get()!.value;
}

export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const inv = db().select().from(invoices).where(eq(invoices.id, id)).get();
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inv.status !== "draft")
    return NextResponse.json({ error: "Invoice is already open" }, { status: 409 });
  if (inv.amountZats <= 0)
    return NextResponse.json({ error: "Invoice needs a positive amount" }, { status: 400 });

  const vk = viewingKey();
  if (!vk) {
    return NextResponse.json(
      { error: "Connect a viewing key first (Settings → Payment detection)" },
      { status: 412 },
    );
  }

  const seq = nextCounter("invoiceSeq");
  const diversifier = nextCounter(`diversifier:${vk.id}`) - 1; // start at 0
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
      label: workspace().businessName,
    },
  ]);

  const slug = slug8();
  db()
    .update(invoices)
    .set({
      status: "open",
      seq,
      slug,
      address,
      zip321Uri: zip321,
      diversifierIndex: diversifier,
      viewingKeyId: vk.id,
      confirmationsRequired: workspace().defaultConfirmations,
      updatedAt: Date.now(),
    })
    .where(eq(invoices.id, id))
    .run();

  emitInvoice({ invoiceId: id, slug, type: "status", status: "open" });
  return NextResponse.json({ ok: true, seq, slug, address, zip321Uri: zip321 });
}
