import { connection } from "next/server";
import { db, workspace } from "@/lib/db";
import { invoices, payments } from "@zveil/db";
import { desc, eq, isNull } from "drizzle-orm";
import { InvoiceTable } from "@/components/invoice/invoice-table";

export const metadata = { title: "Invoices" };
/* eslint-disable react-hooks/purity -- server component; render-time clocks are fine here */

export default async function InvoicesPage() {
  await connection();
  const ws = workspace();
  const invs = db()
    .select()
    .from(invoices)
    .where(eq(invoices.workspaceId, ws.id))
    .orderBy(desc(invoices.createdAt))
    .all();
  const pays = db().select().from(payments).where(isNull(payments.reorgedAt)).all();
  const paidBy = new Map<string, number>();
  for (const p of pays) paidBy.set(p.invoiceId, (paidBy.get(p.invoiceId) ?? 0) + p.zats);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink-strong">Invoices</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          {invs.length} invoice{invs.length === 1 ? "" : "s"} · payments reconcile automatically
        </p>
      </div>
      <InvoiceTable
        now={Date.now()}
        rows={invs.map((i) => ({
          id: i.id,
          seq: i.seq,
          slug: i.slug,
          status: i.status,
          clientName: i.clientName,
          amountZats: i.amountZats,
          paidZats: paidBy.get(i.id) ?? 0,
          dueDate: i.dueDate,
          createdAt: i.createdAt,
        }))}
      />
    </div>
  );
}

// Data comes from SQLite/scanner at request time — never prerender.
export const instant = false;
