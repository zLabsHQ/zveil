import { db } from "./db";
import { invoices, payments } from "@zveil/db";
import { and, eq, isNull, sum } from "drizzle-orm";
import { emitInvoice } from "./bus";

export async function invoicePaidZats(invoiceId: string): Promise<number> {
  const rows = await db()
    .select({ total: sum(payments.zats) })
    .from(payments)
    .where(and(eq(payments.invoiceId, invoiceId), isNull(payments.reorgedAt)));
  return Number(rows[0]?.total ?? 0);
}

export async function maxConfirmations(invoiceId: string): Promise<number> {
  const rows = await db()
    .select({ c: payments.confirmations })
    .from(payments)
    .where(and(eq(payments.invoiceId, invoiceId), isNull(payments.reorgedAt)));
  return rows.reduce((m, r) => Math.max(m, r.c), 0);
}

/** Recompute an invoice's status from its payments and update + broadcast. */
export async function reconcile(invoiceId: string) {
  const [inv] = await db().select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!inv || inv.status === "void" || inv.status === "draft") return;

  const total = await invoicePaidZats(invoiceId);
  const conf = await maxConfirmations(invoiceId);
  const required = inv.confirmationsRequired;
  const now = Date.now();

  let status = inv.status;
  const updates: Partial<typeof invoices.$inferInsert> = { updatedAt: now };

  if (total === 0) {
    status = "open";
  } else if (total >= inv.amountZats && conf >= required) {
    const over = total > inv.amountZats;
    status = over ? "overpaid" : "paid";
    if (!inv.paidAt) updates.paidAt = now;
  } else if (total >= inv.amountZats) {
    status = "seen"; // full amount seen, awaiting confirmations
    if (!inv.firstSeenAt) updates.firstSeenAt = now;
  } else {
    // partial amount — "seen" when unconfirmed, "partially_paid" label is a UI nuance
    status = conf > 0 ? "partially_paid" : "seen";
    if (!inv.firstSeenAt) updates.firstSeenAt = now;
  }

  if (status !== inv.status) {
    updates.status = status;
  }
  await db().update(invoices).set(updates).where(eq(invoices.id, invoiceId));
  emitInvoice({ invoiceId, slug: inv.slug ?? undefined, type: "status", status });
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "Draft",
    open: "Open",
    seen: "Payment seen",
    partially_paid: "Partially paid",
    paid: "Paid",
    overpaid: "Overpaid",
    overdue: "Overdue",
    void: "Void",
  };
  return map[status] ?? status;
}
