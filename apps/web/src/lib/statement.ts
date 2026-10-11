import { invoices, workspaces } from "@zveil/db";
import { eq } from "drizzle-orm";
import { db, paymentsFor } from "./db";
import { invLabel } from "./utils";
import { signProof } from "./receipt";

export interface StatementRow {
  at: number;
  invoice: string;
  client: string;
  pool: string;
  zats: number;
  usdCents: number | null;
  txid: string;
  sample: boolean;
}

/** "YYYY-MM-DD" → UTC day bounds (inclusive). */
export function dayBounds(from: string, to: string) {
  return { from: Date.parse(`${from}T00:00:00.000Z`), to: Date.parse(`${to}T23:59:59.999Z`) };
}

export const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Every payment received by a workspace in [from, to], plus a Zveil-signed proof of the totals. */
export async function buildStatement(workspaceId: string, from: number, to: number) {
  const [ws] = await db().select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  const invs = await db().select().from(invoices).where(eq(invoices.workspaceId, workspaceId));
  const byId = new Map(invs.map((i) => [i.id, i]));
  const pays = (await paymentsFor(invs.map((i) => i.id))).filter((p) => p.seenAt >= from && p.seenAt <= to);

  const rows: StatementRow[] = pays
    .sort((a, b) => a.seenAt - b.seenAt)
    .map((p) => {
      const inv = byId.get(p.invoiceId)!;
      return {
        at: p.seenAt,
        invoice: invLabel(inv),
        client: inv.clientName,
        pool: p.pool,
        zats: p.zats,
        usdCents: p.rateUsdCents ? Math.round((p.zats / 1e8) * p.rateUsdCents) : null,
        txid: p.txid,
        sample: inv.sample,
      };
    });

  const zats = rows.reduce((s, r) => s + r.zats, 0);
  const usdCents = rows.every((r) => r.usdCents != null) ? rows.reduce((s, r) => s + (r.usdCents ?? 0), 0) : null;
  const sample = rows.some((r) => r.sample);
  const proof = signProof({
    t: "statement",
    v: 1,
    network: ws.network,
    recipient: ws.businessName,
    from: isoDay(from),
    to: isoDay(to),
    count: rows.length,
    zats,
    usdCents,
    txids: rows.map((r) => r.txid),
    ...(sample ? { sample: true } : {}),
  });

  return { workspace: ws, rows, zats, usdCents, sample, proof };
}

export const formatUsd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
