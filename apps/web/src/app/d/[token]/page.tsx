import { connection } from "next/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { disclosures, invoices, payments, workspaces } from "@zveil/db";
import { and, eq, isNull } from "drizzle-orm";
import { ZveilWordmark } from "@/components/ui/logo";
import { Amount } from "@/components/money/amount";
import { StatusBadge, type InvoiceStatus } from "@/components/status/status-badge";
import { Banner } from "@/components/feedback/empty-state";
import { zatsToZec } from "@zveil/zip321";
import { truncateAddress } from "@/lib/utils";
import { Eye } from "lucide-react";

/* eslint-disable react-hooks/purity -- server component; render-time clocks are fine here */

export default async function DisclosurePage({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const d = db().select().from(disclosures).where(eq(disclosures.token, token)).get();
  if (!d || d.revokedAt || d.expiresAt < Date.now()) {
    return (
      <div className="veil-bg flex min-h-full flex-col items-center justify-center px-4">
        <ZveilWordmark />
        <h1 className="mt-6 text-lg font-semibold text-ink-strong">Link expired or revoked</h1>
        <p className="mt-1 max-w-xs text-center text-sm text-ink-muted">
          Ask the sender for a fresh disclosure link.
        </p>
      </div>
    );
  }
  const inv = db().select().from(invoices).where(eq(invoices.id, d.invoiceId)).get();
  if (!inv) notFound();
  const pays = db().select().from(payments).where(and(eq(payments.invoiceId, inv.id), isNull(payments.reorgedAt))).all();
  const ws = db().select().from(workspaces).where(eq(workspaces.id, inv.workspaceId)).get()!;
  const total = pays.reduce((s, p) => s + p.zats, 0);

  return (
    <div className="veil-bg flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-[560px] items-center justify-between px-4 py-5">
        <ZveilWordmark />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
          <Eye className="size-3" aria-hidden /> Private disclosure — {d.label}
        </span>
      </header>
      <main className="mx-auto w-full max-w-[560px] flex-1 px-4 pb-16">
        <Banner tone="info" title="Invoice-scoped view" className="mb-4">
          This link reveals only invoice INV-{String(inv.seq ?? 0).padStart(4, "0")}. Nothing else in
          this wallet is visible here.
        </Banner>
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-md">
          <div className="h-[3px] w-full bg-brand-600" />
          <div className="flex items-center justify-between px-6 pt-5">
            <div>
              <div className="text-sm font-semibold text-ink">
                INV-{String(inv.seq ?? 0).padStart(4, "0")} · {ws.businessName}
              </div>
              <div className="text-xs text-ink-muted">For {inv.clientName}</div>
            </div>
            <StatusBadge status={(inv.status === "partially_paid" ? "partial" : inv.status) as InvoiceStatus} />
          </div>
          <div className="px-6 pt-4">
            <Amount zats={inv.amountZats} fiat={inv.amountFiatCents ? inv.amountFiatCents / 100 : null} size="hero" />
          </div>
          <div className="mt-5 border-t border-border px-6 py-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-ink-muted">Received</div>
              <div className="tabular text-right font-medium text-ink">{zatsToZec(total)} ZEC</div>
              <div className="text-ink-muted">Payments</div>
              <div className="tabular text-right font-medium text-ink">{pays.length}</div>
              <div className="text-ink-muted">Expires</div>
              <div className="text-right font-medium text-ink">
                {new Date(d.expiresAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          {pays.length > 0 && (
            <div className="border-t border-border px-6 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                Confirmed transactions
              </div>
              <div className="mt-2 space-y-1.5">
                {pays.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-ink-soft">{truncateAddress(p.txid, 8, 6)}</span>
                    <span className="tabular font-medium text-ink">+{zatsToZec(p.zats)} ZEC</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Data comes from SQLite/scanner at request time — never prerender.
export const instant = false;
