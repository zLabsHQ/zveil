"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StatusBadge, type InvoiceStatus } from "@/components/status/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { zatsToZec } from "@zveil/zip321";

export interface InvoiceRow {
  id: string;
  seq: number | null;
  slug: string | null;
  status: string;
  clientName: string;
  amountZats: number;
  paidZats: number;
  dueDate: number | null;
  createdAt: number;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid", label: "Paid" },
  { key: "attention", label: "Needs attention" },
] as const;

function badge(s: string): InvoiceStatus {
  const m: Record<string, InvoiceStatus> = { partially_paid: "partial" };
  return (m[s] ?? s) as InvoiceStatus;
}

export function InvoiceTable({ rows, now }: { rows: InvoiceRow[]; now: number }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "unpaid") return ["open", "seen", "partially_paid"].includes(r.status);
      if (filter === "paid") return ["paid", "overpaid"].includes(r.status);
      if (filter === "attention")
        return r.status === "overdue" || (r.dueDate && r.dueDate < now && ["open", "seen", "partially_paid"].includes(r.status));
      return true;
    });
  }, [rows, filter, now]);

  return (
    <div className="rounded-lg border border-border bg-surface shadow-xs">
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer",
              filter === f.key ? "bg-surface-sunken text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {f.label}
          </button>
        ))}
        <a
          href="/api/export"
          className="ml-auto rounded-md px-3 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
        >
          Export CSV ↓
        </a>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={filter === "all" ? "No invoices yet" : `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} invoices`}
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
        <>
          <div className="hidden grid-cols-[90px_1fr_110px_130px_110px] items-center gap-4 border-b border-border px-5 py-2 text-[11px] font-medium uppercase tracking-[0.05em] text-ink-muted md:grid">
            <span>Invoice</span><span>Client</span><span>Amount</span><span>Status</span><span>Due</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((r) => {
              const late = r.dueDate && r.dueDate < now && ["open", "seen", "partially_paid"].includes(r.status);
              const display = late ? "overdue" : r.status;
              return (
                <Link
                  key={r.id}
                  href={`/app/invoices/${r.id}`}
                  className="grid grid-cols-2 items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-hover md:grid-cols-[90px_1fr_110px_130px_110px]"
                >
                  <span className="font-mono text-[13px] text-ink-muted">
                    {r.seq ? `INV-${String(r.seq).padStart(4, "0")}` : "Draft"}
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium text-ink">{r.clientName}</span>
                  <span className="tabular text-sm text-ink-soft">{zatsToZec(r.amountZats)} ZEC</span>
                  <StatusBadge status={badge(display)} />
                  <span className="text-xs text-ink-muted">
                    {r.dueDate
                      ? new Date(r.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
