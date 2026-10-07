import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { invoices, payments, disclosures } from "@zveil/db";
import { desc, eq } from "drizzle-orm";
import { Amount } from "@/components/money/amount";
import { StatusBadge, type InvoiceStatus } from "@/components/status/status-badge";
import { Card, CardHeader } from "@/components/ui/card";
import { AddressField, CopyButton } from "@/components/zcash/address-field";
import { InvoiceActions, InvoiceLinkRow } from "@/components/invoice/invoice-actions";
import { Banner } from "@/components/feedback/empty-state";
import { truncateAddress } from "@/lib/utils";
import { zatsToZec } from "@zveil/zip321";
import { zecUsd, fiatForZats } from "@/lib/pricing";

export const dynamic = "force-dynamic";
/* eslint-disable react-hooks/purity -- server component; render-time clocks are fine here */

function badge(s: string): InvoiceStatus {
  return (s === "partially_paid" ? "partial" : s) as InvoiceStatus;
}

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = db().select().from(invoices).where(eq(invoices.id, id)).get();
  if (!inv) notFound();
  const pays = db().select().from(payments).where(eq(payments.invoiceId, id)).orderBy(desc(payments.seenAt)).all();
  const links = db().select().from(disclosures).where(eq(disclosures.invoiceId, id)).all();
  const rate = await zecUsd();
  const paid = pays.filter((p) => !p.reorgedAt).reduce((s, p) => s + p.zats, 0);

  const seqLabel = inv.seq ? `INV-${String(inv.seq).padStart(4, "0")}` : "Draft invoice";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/app/invoices" className="text-[13px] font-medium text-ink-muted hover:text-ink">
          ← Invoices
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="font-mono text-xl font-semibold text-ink-strong">{seqLabel}</h1>
          <StatusBadge status={badge(inv.status)} />
        </div>
        <p className="mt-0.5 text-sm text-ink-muted">{inv.clientName}</p>
      </div>

      {inv.status === "paid" && (
        <Banner tone="ok" title="Paid in full">
          {pays.length} payment{pays.length > 1 ? "s" : ""} confirmed ·{" "}
          <Link href={`/r/${inv.id}`} className="font-medium underline">View signed receipt →</Link>
        </Banner>
      )}

      <InvoiceActions invoiceId={inv.id} status={inv.status} slug={inv.slug} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-muted">Total due</div>
          <div className="mt-2">
            <Amount zats={inv.amountZats} fiat={rate ? fiatForZats(inv.amountZats, rate) : null} size="md" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-muted">Received</div>
          <div className="mt-2">
            <Amount zats={paid} size="md" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-muted">Due date</div>
          <div className="mt-2 text-[22px] font-semibold leading-7 text-ink-strong">
            {inv.dueDate
              ? new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "—"}
          </div>
        </Card>
      </div>

      {inv.slug && <InvoiceLinkRow slug={inv.slug} />}
      {inv.address && (
        <AddressField label="Payment address" value={inv.address} className="font-mono" />
      )}

      <Card>
        <CardHeader title="Payments" hint={`${pays.length} detected`} />
        {pays.length === 0 ? (
          <div className="px-5 py-8 text-sm text-ink-muted">
            No payments yet. When a client pays, it appears here within seconds of broadcast.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pays.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                <span className="tabular flex-1 text-sm font-medium text-ink">
                  +{zatsToZec(p.zats)} ZEC
                </span>
                <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[11px] font-medium capitalize text-ink-soft">
                  {p.pool}
                </span>
                <span className="font-mono text-xs text-ink-muted" title={p.txid}>
                  {truncateAddress(p.txid, 8, 6)}
                </span>
                <CopyButton value={p.txid} />
                <span className="tabular w-24 text-right text-xs text-ink-muted">
                  {p.reorgedAt ? (
                    <span className="text-danger-fg">reorged</span>
                  ) : (
                    `${p.confirmations} conf`
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {links.filter((l) => !l.revokedAt && l.expiresAt > Date.now()).length > 0 && (
        <Card>
          <CardHeader title="Private share links" hint="Invoice-scoped disclosure" />
          <div className="divide-y divide-border">
            {links
              .filter((l) => !l.revokedAt && l.expiresAt > Date.now())
              .map((l) => (
                <div key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-ink">{l.label}</span>
                  <span className="text-xs text-ink-muted">
                    expires {new Date(l.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
