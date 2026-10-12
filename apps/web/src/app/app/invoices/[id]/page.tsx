import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, ownedInvoice } from "@/lib/db";
import { payments, disclosures, scannerEvents } from "@zveil/db";
import { desc, eq, asc } from "drizzle-orm";
import { Amount } from "@/components/money/amount";
import { StatusBadge, type InvoiceStatus } from "@/components/status/status-badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { AddressField, CopyButton } from "@/components/zcash/address-field";
import { InvoiceActions, InvoiceLinkRow } from "@/components/invoice/invoice-actions";
import { Timeline, type TimelineEvent } from "@/components/invoice/timeline";
import { Banner } from "@/components/feedback/empty-state";
import { truncateAddress } from "@/lib/utils";
import { zatsToZec } from "@z-labs/zip321";
import { zecUsd, fiatForZats } from "@/lib/pricing";

/* eslint-disable react-hooks/purity -- server component; render-time clocks are fine here */

function badge(s: string): InvoiceStatus {
  return (s === "partially_paid" ? "partial" : s) as InvoiceStatus;
}

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const inv = await ownedInvoice(id);
  if (!inv) notFound();
  const pays = await db().select().from(payments).where(eq(payments.invoiceId, id)).orderBy(desc(payments.seenAt));
  const links = await db().select().from(disclosures).where(eq(disclosures.invoiceId, id));
  const evs = await db()
    .select()
    .from(scannerEvents)
    .where(eq(scannerEvents.invoiceId, id))
    .orderBy(asc(scannerEvents.receivedAt));
  const rate = await zecUsd();
  const paid = pays.filter((p) => !p.reorgedAt).reduce((s, p) => s + p.zats, 0);

  const seqLabel = inv.seq ? `INV-${String(inv.seq).padStart(4, "0")}` : "Draft invoice";

  // --- Timeline: everything we observed about this invoice, in order ---
  const timeline: TimelineEvent[] = [
    { at: inv.createdAt, kind: "created", title: "Invoice created", detail: `for ${inv.clientName}` },
  ];
  if (inv.issuedAt) {
    timeline.push({
      at: inv.issuedAt,
      kind: "issued",
      title: `Issued as ${seqLabel}`,
      detail: `unique shielded address · diversifier #${inv.diversifierIndex ?? 0}`,
    });
  }
  if (evs.length > 0) {
    for (const e of evs) {
      const p = JSON.parse(e.payloadJson) as {
        minedHeight?: number;
        zats?: number;
        pool?: string;
        txid?: string;
      };
      const amt = p.zats ? `+${zatsToZec(p.zats)} ZEC` : "";
      const meta = [amt, p.pool, p.txid ? `tx ${truncateAddress(p.txid, 8, 6)}` : ""].filter(Boolean).join(" · ");
      if (e.type === "payment.detected")
        timeline.push({ at: e.receivedAt, kind: "detected", title: "Payment detected in mempool", detail: meta });
      else if (e.type === "payment.mined")
        timeline.push({
          at: e.receivedAt,
          kind: "mined",
          title: `Confirmed in block #${p.minedHeight?.toLocaleString() ?? "?"}`,
          detail: meta,
        });
      else if (e.type === "payment.reorged")
        timeline.push({ at: e.receivedAt, kind: "reorged", title: "Payment reorged out", detail: meta });
    }
  } else {
    for (const p of [...pays].reverse()) {
      timeline.push({
        at: p.seenAt,
        kind: "detected",
        title: "Payment detected",
        detail: `+${zatsToZec(p.zats)} ZEC · ${p.pool} · tx ${truncateAddress(p.txid, 8, 6)}`,
      });
      if (p.minedHeight)
        timeline.push({
          at: p.seenAt,
          kind: "mined",
          title: `Confirmed in block #${p.minedHeight.toLocaleString()}`,
          detail: `${p.confirmations} confirmation${p.confirmations === 1 ? "" : "s"}`,
        });
    }
  }
  if (inv.paidAt) timeline.push({ at: inv.paidAt, kind: "paid", title: "Paid in full" });
  if (inv.reconResolvedAt)
    timeline.push({
      at: inv.reconResolvedAt,
      kind: "reconciled",
      title: "Reconciled",
      detail: inv.reconNote ?? undefined,
    });
  for (const l of links) {
    timeline.push({
      at: l.createdAt,
      kind: "shared",
      title: l.kind === "statement" ? "Income statement shared" : "Private link shared",
      detail: `${l.label ?? "viewer"} · expires ${new Date(l.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${l.revokedAt ? " · revoked" : ""}`,
    });
  }
  timeline.sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  if (inv.status === "open" || inv.status === "seen" || inv.status === "partially_paid" || inv.status === "overdue") {
    timeline.push({
      at: null,
      kind: "awaiting",
      title: inv.status === "partially_paid" ? "Awaiting remaining balance" : "Awaiting payment",
      detail: inv.address ? `watching ${truncateAddress(inv.address, 12, 8)}` : undefined,
    });
  }
  const now = Date.now();

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
        <Stat label="Total due">
          <Amount zats={inv.amountZats} fiat={rate ? fiatForZats(inv.amountZats, rate) : null} size="md" />
        </Stat>
        <Stat label="Received">
          <Amount zats={paid} size="md" />
        </Stat>
        <Stat label="Due date">
          <div className="text-[22px] font-semibold leading-7 text-ink-strong">
            {inv.dueDate
              ? new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "—"}
          </div>
        </Stat>
      </div>

      {inv.slug && <InvoiceLinkRow slug={inv.slug} />}
      {inv.address && (
        <AddressField label="Payment address" value={inv.address} className="font-mono" />
      )}

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border py-3.5">
          <CardTitle className="text-sm font-semibold">Payments</CardTitle>
          <CardDescription>{pays.length} detected</CardDescription>
        </CardHeader>
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

      <Timeline events={timeline} now={now} />

      {links.filter((l) => !l.revokedAt && l.expiresAt > Date.now()).length > 0 && (
        <Card className="gap-0 py-0">
          <CardHeader className="border-b border-border py-3.5">
            <CardTitle className="text-sm font-semibold">Private share links</CardTitle>
            <CardDescription>Invoice-scoped disclosure</CardDescription>
          </CardHeader>
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

// Data comes from SQLite/scanner at request time — never prerender.
export const instant = false;
