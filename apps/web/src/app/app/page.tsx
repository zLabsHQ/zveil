import { connection } from "next/server";
import Link from "next/link";
import { db, viewingKey, workspace } from "@/lib/db";
import { activity, aging, exceptions, hasRealDisclosure, invLabel, loadLedger, metrics, outstanding, receivedByWeek } from "@/lib/ledger";
import { Amount } from "@/components/money/amount";
import { StatusBadge } from "@/components/status/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { ActivityFeed, AgingBreakdown, BigNumber, GetStarted, Kpi, Panel, ReceivedChart, SampleTag, type Step } from "@/components/dashboard/widgets";
import { AutoRefresh, ClearSampleButton, ScannerHealth } from "@/components/dashboard/live";
import { AlertTriangle, ArrowRight, Download, FileText, Plus } from "lucide-react";
import { zatsToZec } from "@z-labs/zip321";
import { zecUsd, fiatForZats } from "@/lib/pricing";
import { FAUCET_URL } from "@/lib/network";
import { passkeys } from "@zveil/db";
import { eq } from "drizzle-orm";
import { SecureBanner } from "@/components/auth/secure-banner";

export const metadata = { title: "Dashboard" };

/* eslint-disable react-hooks/purity -- server component; render-time clocks are fine here */

type BadgeStatus = Parameters<typeof StatusBadge>[0]["status"];
const toBadge = (s: string) => (s === "partially_paid" ? "partial" : s) as BadgeStatus;

export default async function Dashboard() {
  await connection();
  const now = Date.now();
  const ws = await workspace();
  const [ledger, vk, rate] = await Promise.all([loadLedger(ws.id), viewingKey(), zecUsd()]);
  const m = metrics(ledger, now);
  const real = ledger.invs.filter((i) => !i.sample);
  const realIds = new Set(real.map((i) => i.id));
  const hasSample = ledger.invs.some((i) => i.sample);
  const openExceptions = exceptions(ledger, now).filter((e) => !e.resolved);
  const recent = ledger.invs
    .filter((i) => i.status !== "draft")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  const sentReal = real.some((i) => i.seq);
  const paidReal = ledger.pays.some((p) => realIds.has(p.invoiceId));
  const [pk] = await db().select({ id: passkeys.id }).from(passkeys).where(eq(passkeys.workspaceId, ws.id)).limit(1);
  const unsecured = !pk && sentReal; // prompt once the workspace has real work worth keeping
  const steps: Step[] = [
    {
      title: "Detection connected",
      body: vk?.shared ? "Shared testnet viewing key — connect your own anytime." : "Your own viewing key is connected.",
      done: Boolean(vk),
      href: "/app/settings",
    },
    { title: "Issue an invoice", body: "Get a unique shielded address and ZIP-321 link.", done: sentReal, href: "/app/invoices/new", cta: "New invoice" },
    { title: "Get testnet ZEC", body: "Free from the faucet into Zashi, Zingo or YWallet.", done: paidReal, href: FAUCET_URL, cta: "Open faucet", external: true },
    { title: "Receive a payment", body: "Pay the invoice link — watch it flip to Paid live.", done: paidReal },
    {
      title: "Share proof of income",
      href: "/app/payments",
      cta: "Share statement",
      body: "Send an accountant a signed income statement.",
      done: await hasRealDisclosure(db(), ws.id, [...realIds]),
    },
  ];
  const onboarding = steps.some((s) => !s.done);
  const trend = m.receivedPrev30 ? (m.received30 - m.receivedPrev30) / m.receivedPrev30 : null;
  const usd = (z: number) => (rate ? fiatForZats(z, rate) : null);

  return (
    <div className="flex flex-col gap-5">
      <AutoRefresh />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink-strong">Overview</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {ws.businessName} · receivables on the Zcash testnet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/export">
            <Button size="sm" variant="secondary" className="h-8 gap-1.5">
              <Download className="size-3.5" aria-hidden /> Export
            </Button>
          </a>
          <Link href="/app/invoices/new">
            <Button size="sm" className="h-8 gap-1.5">
              <Plus className="size-3.5" strokeWidth={2.2} aria-hidden /> New invoice
            </Button>
          </Link>
        </div>
      </div>

      {hasSample && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-4 py-3">
          <div className="flex items-center gap-2.5 text-[13px] text-ink-soft">
            <SampleTag />
            Rows tagged Sample show what a few months on Zveil look like. Everything you create is real testnet data.
          </div>
          <ClearSampleButton />
        </div>
      )}

      {unsecured && <SecureBanner />}

      {onboarding && <GetStarted steps={steps} />}

      {openExceptions.length > 0 && (
        <Link
          href="/app/payments"
          className="flex items-center gap-3 rounded-xl border border-pending-fg/20 bg-pending-bg px-4 py-3 text-[13px] transition hover:border-pending-fg/40"
        >
          <AlertTriangle className="size-4 text-pending-fg" strokeWidth={2} aria-hidden />
          <span className="flex-1 text-ink">
            <span className="font-semibold">
              {openExceptions.length} payment{openExceptions.length > 1 ? "s" : ""} need reconciliation
            </span>{" "}
            <span className="text-ink-soft">— over, under or late payments waiting for a decision.</span>
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-pending-fg">
            Review <ArrowRight className="size-3.5" aria-hidden />
          </span>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Outstanding" hint={`${m.openCount} open · ${m.overdueCount} overdue`}>
          <Amount zats={m.outstanding} fiat={usd(m.outstanding)} size="md" />
        </Kpi>
        <Kpi label="Received · 30 days" trend={trend} hint={trend == null ? "No prior period yet" : "vs previous 30 days"}>
          <Amount zats={m.received30} fiat={usd(m.received30)} size="md" />
        </Kpi>
        <Kpi label="Avg. time to pay" hint="From issue to paid in full">
          <BigNumber>
            {m.avgDaysToPay == null ? "—" : m.avgDaysToPay.toFixed(1)}
            <span className="ml-1 text-[13px] font-medium text-ink-muted">days</span>
          </BigNumber>
        </Kpi>
        <Kpi
          label="Collection rate"
          hint={
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-sunken">
              <span className="block h-full rounded-full bg-paid-fg" style={{ width: `${Math.round((m.collectionRate ?? 0) * 100)}%` }} />
            </span>
          }
        >
          <BigNumber>{m.collectionRate == null ? "—" : `${Math.round(m.collectionRate * 100)}%`}</BigNumber>
        </Kpi>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel title="Received" description="Shielded payments detected, by week" className="lg:col-span-2">
          <ReceivedChart weeks={receivedByWeek(ledger, now)} />
        </Panel>
        <Panel title="Receivables aging" description="Unpaid balance by days past due">
          <AgingBreakdown buckets={aging(ledger, now)} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-3">
        <Panel
          title="Recent invoices"
          className="lg:col-span-2"
          bodyClassName="px-0 pb-1"
          action={
            <Link href="/app/invoices" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              body="Issue your first invoice and get paid privately in ZEC."
              action={
                <Link href="/app/invoices/new">
                  <Button size="sm" variant="secondary" className="gap-1.5">
                    <Plus className="size-3.5" aria-hidden /> New invoice
                  </Button>
                </Link>
              }
            />
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-y border-border bg-paper text-left text-[11px] font-medium uppercase tracking-[0.05em] text-ink-faint">
                  <th className="px-5 py-2 font-medium">Invoice</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 text-right font-medium max-sm:hidden">Amount</th>
                  <th className="px-3 py-2 text-right font-medium max-md:hidden">Balance</th>
                  <th className="px-5 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((i) => (
                  <tr key={i.id} className="group transition-colors hover:bg-surface-hover">
                    <td className="px-5 py-2.5">
                      <Link href={`/app/invoices/${i.id}`} className="font-mono text-ink-soft group-hover:text-ink">
                        {invLabel(i)}
                      </Link>
                    </td>
                    <td className="max-w-[220px] px-3 py-2.5">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium text-ink">{i.clientName}</span>
                        {i.sample && <SampleTag />}
                      </span>
                    </td>
                    <td className="tabular px-3 py-2.5 text-right text-ink-soft max-sm:hidden">{zatsToZec(i.amountZats)}</td>
                    <td className="tabular px-3 py-2.5 text-right text-ink-soft max-md:hidden">
                      {zatsToZec(outstanding(i, ledger.paidBy))}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <StatusBadge status={toBadge(i.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <div className="flex flex-col gap-3">
          <ScannerHealth />
          <Panel title="Activity" description="Live from the chain and your workspace">
            <ActivityFeed items={activity(ledger, 6)} now={now} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

export const instant = false;
