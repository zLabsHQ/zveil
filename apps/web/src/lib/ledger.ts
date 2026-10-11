import { invoices, payments, disclosures, type Db } from "@zveil/db";
import { eq, inArray, or } from "drizzle-orm";
import { cache } from "react";
import { db, paymentsFor } from "./db";

type Invoice = typeof invoices.$inferSelect;
type Payment = typeof payments.$inferSelect;

const DAY = 86_400_000;
const OPEN = new Set(["open", "seen", "partially_paid", "overdue"]);

export interface Ledger {
  invs: Invoice[];
  pays: Payment[];
  paidBy: Map<string, number>;
}

/** Everything a receivables view needs for one workspace, in two queries. */
export const loadLedger = cache(async (workspaceId: string): Promise<Ledger> => {
  const invs = await db().select().from(invoices).where(eq(invoices.workspaceId, workspaceId));
  const pays = await paymentsFor(invs.map((i) => i.id));
  const paidBy = new Map<string, number>();
  for (const p of pays) paidBy.set(p.invoiceId, (paidBy.get(p.invoiceId) ?? 0) + p.zats);
  return { invs, pays, paidBy };
});

export const outstanding = (i: Invoice, paidBy: Map<string, number>) =>
  Math.max(i.amountZats - (paidBy.get(i.id) ?? 0), 0);

export const isPastDue = (i: Invoice, now: number) => Boolean(i.dueDate && i.dueDate < now && OPEN.has(i.status));

// ---------------------------------------------------------------- metrics

export function metrics({ invs, paidBy }: Ledger, now: number) {
  const billed = invs.filter((i) => i.status !== "draft" && i.status !== "void");
  const open = billed.filter((i) => OPEN.has(i.status));
  const paid = billed.filter((i) => i.paidAt);
  const received = billed.reduce((s, i) => s + Math.min(paidBy.get(i.id) ?? 0, i.amountZats), 0);
  const invoiced = billed.reduce((s, i) => s + i.amountZats, 0);
  const days = paid.map((i) => (i.paidAt! - i.createdAt) / DAY);
  const since = now - 30 * DAY;
  const prev = now - 60 * DAY;
  const inWindow = (from: number, to: number) =>
    paid.filter((i) => i.paidAt! >= from && i.paidAt! < to).reduce((s, i) => s + i.amountZats, 0);
  return {
    openCount: open.length,
    outstanding: open.reduce((s, i) => s + outstanding(i, paidBy), 0),
    overdueCount: open.filter((i) => isPastDue(i, now)).length,
    received30: inWindow(since, now + 1),
    receivedPrev30: inWindow(prev, since),
    collectionRate: invoiced ? received / invoiced : null,
    avgDaysToPay: days.length ? days.reduce((a, b) => a + b, 0) / days.length : null,
  };
}

// ---------------------------------------------------------------- aging

export const AGING = ["Current", "1–30 days", "31–60 days", "60+ days"] as const;

export function aging({ invs, paidBy }: Ledger, now: number) {
  const buckets = AGING.map((label) => ({ label, zats: 0, count: 0 }));
  for (const i of invs) {
    if (!OPEN.has(i.status)) continue;
    const late = i.dueDate ? (now - i.dueDate) / DAY : 0;
    const b = late <= 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : 3;
    buckets[b].zats += outstanding(i, paidBy);
    buckets[b].count += 1;
  }
  return buckets;
}

// ---------------------------------------------------------------- received by week

export function receivedByWeek({ pays }: Ledger, now: number, weeks = 12) {
  const end = now;
  const start = end - weeks * 7 * DAY;
  const out = Array.from({ length: weeks }, (_, k) => ({
    start: start + k * 7 * DAY,
    zats: 0,
  }));
  for (const p of pays) {
    if (p.seenAt < start || p.seenAt > end) continue;
    out[Math.min(Math.floor((p.seenAt - start) / (7 * DAY)), weeks - 1)].zats += p.zats;
  }
  return out;
}

// ---------------------------------------------------------------- reconciliation

export type ExceptionKind = "overpaid" | "underpaid" | "after_void";

export interface ReconException {
  kind: ExceptionKind;
  invoice: Invoice;
  paid: number;
  delta: number; // + over, − short
  resolved: boolean;
}

export function exceptions({ invs, paidBy }: Ledger, now: number): ReconException[] {
  const out: ReconException[] = [];
  for (const i of invs) {
    const paid = paidBy.get(i.id) ?? 0;
    let kind: ExceptionKind | null = null;
    if (i.status === "overpaid") kind = "overpaid";
    else if (i.status === "void" && paid > 0) kind = "after_void";
    else if (i.status === "partially_paid" && isPastDue(i, now)) kind = "underpaid";
    if (kind) out.push({ kind, invoice: i, paid, delta: paid - i.amountZats, resolved: Boolean(i.reconResolvedAt) });
  }
  return out.sort((a, b) => Number(a.resolved) - Number(b.resolved) || b.invoice.updatedAt - a.invoice.updatedAt);
}

// ---------------------------------------------------------------- activity

export interface ActivityItem {
  at: number;
  kind: "created" | "sent" | "payment" | "paid";
  invoice: Invoice;
  zats?: number;
  pool?: string;
}

export function activity({ invs, pays }: Ledger, limit = 8): ActivityItem[] {
  const byId = new Map(invs.map((i) => [i.id, i]));
  const items: ActivityItem[] = [];
  for (const i of invs) {
    items.push({ at: i.createdAt, kind: i.seq ? "sent" : "created", invoice: i });
    if (i.paidAt) items.push({ at: i.paidAt + 1, kind: "paid", invoice: i });
  }
  for (const p of pays) {
    const inv = byId.get(p.invoiceId);
    if (inv) items.push({ at: p.seenAt, kind: "payment", invoice: inv, zats: p.zats, pool: p.pool });
  }
  return items.sort((a, b) => b.at - a.at).slice(0, limit);
}

/** Whether the workspace has shared a disclosure: a statement, or a link on a real invoice. */
export async function hasRealDisclosure(conn: Db, workspaceId: string, invoiceIds: string[]) {
  const scope = invoiceIds.length
    ? or(eq(disclosures.workspaceId, workspaceId), inArray(disclosures.invoiceId, invoiceIds))
    : eq(disclosures.workspaceId, workspaceId);
  const rows = await conn.select({ id: disclosures.id }).from(disclosures).where(scope).limit(1);
  return rows.length > 0;
}

export { invLabel } from "./utils";
