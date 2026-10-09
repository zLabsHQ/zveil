import { connection } from "next/server";
import Link from "next/link";
import { db, workspace } from "@/lib/db";
import { invoices, payments } from "@zveil/db";
import { eq, isNull } from "drizzle-orm";
import { Amount } from "@/components/money/amount";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { EmptyState, Banner } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/status/status-badge";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { zatsToZec } from "@z-labs/zip321";
import { zecUsd, fiatForZats } from "@/lib/pricing";

export const metadata = { title: "Dashboard" };

/* eslint-disable react-hooks/purity -- server component; render-time clocks are fine here */

type BadgeStatus = Parameters<typeof StatusBadge>[0]["status"];
function toBadge(s: string): BadgeStatus {
  const m: Record<string, BadgeStatus> = {
    seen: "seen",
    partially_paid: "partial",
    overdue: "overdue",
    overpaid: "overpaid",
    open: "open",
    paid: "paid",
    draft: "draft",
    void: "void",
  };
  return (m[s] ?? "open") as BadgeStatus;
}

export default async function Dashboard() {
  await connection();
  const ws = await workspace();
  const rate = await zecUsd();
  const invs = await db().select().from(invoices).where(eq(invoices.workspaceId, ws.id));
  const pays = await db().select().from(payments).where(isNull(payments.reorgedAt));

  const paidBy = new Map<string, number>();
  for (const p of pays) paidBy.set(p.invoiceId, (paidBy.get(p.invoiceId) ?? 0) + p.zats);

  const open = invs.filter((i) => ["open", "seen", "partially_paid"].includes(i.status));
  const openTotal = open.reduce((s, i) => s + (i.amountZats - (paidBy.get(i.id) ?? 0)), 0);
  const month = new Date();
  month.setDate(1);
  month.setHours(0, 0, 0, 0);
  const paidMonth = invs
    .filter((i) => i.paidAt && i.paidAt >= month.getTime())
    .reduce((s, i) => s + i.amountZats, 0);
  const needsAttention = invs.filter(
    (i) =>
      i.status === "overdue" ||
      (i.dueDate && i.dueDate < Date.now() && ["open", "seen", "partially_paid"].includes(i.status)),
  );
  const recent = invs
    .filter((i) => i.status !== "draft")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink-strong">
          Good morning, {ws.businessName.split(" ")[0]}
        </h1>
        <p className="mt-0.5 text-sm text-ink-muted">Here&apos;s what your ZEC invoices are doing.</p>
      </div>

      {needsAttention.length > 0 && (
        <Banner tone="warn" title={`${needsAttention.length} invoice${needsAttention.length > 1 ? "s" : ""} past due`}>
          {needsAttention.map((i) => `INV-${i.seq ?? "—"} ${i.clientName}`).join(" · ")}
        </Banner>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Awaiting payment" sub={rate ? `≈ $${(fiatForZats(openTotal, rate)).toFixed(2)}` : undefined}>
          <Amount zats={openTotal} size="md" />
        </Stat>
        <Stat label="Paid this month" sub={rate ? `≈ $${fiatForZats(paidMonth, rate).toFixed(2)}` : undefined}>
          <Amount zats={paidMonth} size="md" />
        </Stat>
        <Stat label="Open invoices" sub={`${open.length} pending`}>
          <div className="tabular text-[22px] font-semibold leading-7 text-ink-strong">{open.length}</div>
        </Stat>
        <Stat label="All-time invoices">
          <div className="tabular text-[22px] font-semibold leading-7 text-ink-strong">
            {invs.length}
          </div>
        </Stat>
      </div>

      <Card className="gap-0 border border-border py-0 shadow-xs ring-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="text-sm font-semibold text-ink">Recent invoices</div>
          <Link href="/app/invoices" className="text-[13px] font-medium text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            body="Create your first invoice and get paid privately in ZEC."
            action={
              <Link href="/app/invoices/new">
                <Button size="sm" variant="secondary" className="gap-1.5">
                  <Plus className="size-3.5" aria-hidden /> New invoice
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {recent.map((i) => (
              <Link
                key={i.id}
                href={`/app/invoices/${i.id}`}
                className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-hover"
              >
                <span className="w-[74px] shrink-0 font-mono text-[13px] text-ink-muted">
                  {i.seq ? `INV-${String(i.seq).padStart(4, "0")}` : "Draft"}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {i.clientName}
                </span>
                <span className="tabular hidden text-sm text-ink-soft sm:block">
                  {zatsToZec(i.amountZats)} ZEC
                </span>
                <span className="hidden text-xs text-ink-muted sm:block">
                  {new Date(i.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <StatusBadge status={toBadge(i.status)} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Data comes from SQLite/scanner at request time — never prerender.
export const instant = false;
