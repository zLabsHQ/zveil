import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { invoices, payments, scannerEvents } from "@zveil/db";
import { eq, sql } from "drizzle-orm";
import { reconcile } from "@/lib/reconcile";
import { emitInvoice } from "@/lib/bus";

const SECRET = process.env.SCANNER_WEBHOOK_SECRET ?? "dev-secret";

const Event = z.object({
  eventId: z.string().min(1),
  type: z.enum(["payment.detected", "payment.mined", "payment.reorged"]),
  address: z.string().optional(),
  invoiceId: z.string().optional(),
  txid: z.string().min(1),
  pool: z.enum(["ironwood", "orchard", "sapling", "transparent"]),
  outputIndex: z.number().int().nonnegative(),
  zats: z.number().int().nonnegative(),
  memoPreview: z.string().optional(),
  minedHeight: z.number().int().optional(),
  confirmations: z.number().int().nonnegative().optional(),
});

function verifySignature(raw: string, sig: string | null): boolean {
  if (!sig) return false;
  const expected = createHmac("sha256", SECRET).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig.replace(/^sha256=/, ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-zveil-signature"))) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }
  const parsed = Event.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return NextResponse.json({ error: "Malformed event" }, { status: 400 });
  }
  const ev = parsed.data;
  const now = Date.now();

  // dedup by eventId
  const seen = db().select().from(scannerEvents).where(eq(scannerEvents.eventId, ev.eventId)).get();
  if (seen) return NextResponse.json({ ok: true, deduped: true });
  db()
    .insert(scannerEvents)
    .values({
      eventId: ev.eventId,
      invoiceId: ev.invoiceId ?? null,
      type: ev.type,
      receivedAt: now,
      payloadJson: raw,
    })
    .run();

  // locate invoice by id or address
  let invoiceId = ev.invoiceId;
  if (!invoiceId && ev.address) {
    invoiceId = db().select({ id: invoices.id }).from(invoices).where(eq(invoices.address, ev.address)).get()?.id;
  }
  if (!invoiceId) return NextResponse.json({ ok: true, unmatched: true });

  if (ev.type === "payment.detected" || ev.type === "payment.mined") {
    db()
      .insert(payments)
      .values({
        id: `${ev.txid}:${ev.pool}:${ev.outputIndex}`,
        invoiceId,
        txid: ev.txid,
        pool: ev.pool,
        outputIndex: ev.outputIndex,
        zats: ev.zats,
        memoPreview: ev.memoPreview ?? null,
        minedHeight: ev.minedHeight ?? null,
        confirmations: ev.confirmations ?? (ev.type === "payment.mined" ? 1 : 0),
        seenAt: now,
      })
      .onConflictDoUpdate({
        target: payments.id,
        set: {
          minedHeight: sql`coalesce(excluded.mined_height, ${payments.minedHeight})`,
          confirmations: sql`coalesce(excluded.confirmations, ${payments.confirmations})`,
        },
      })
      .run();
    emitInvoice({
      invoiceId,
      type: "payment",
      payment: { txid: ev.txid, zats: ev.zats, pool: ev.pool, confirmations: ev.confirmations ?? 0 },
    });
  } else if (ev.type === "payment.reorged") {
    db()
      .update(payments)
      .set({ reorgedAt: now })
      .where(eq(payments.id, `${ev.txid}:${ev.pool}:${ev.outputIndex}`))
      .run();
    emitInvoice({ invoiceId, type: "reorg" });
  }

  reconcile(invoiceId);
  return NextResponse.json({ ok: true });
}
