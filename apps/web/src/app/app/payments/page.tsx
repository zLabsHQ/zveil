import { connection } from "next/server";
import Link from "next/link";
import { db, workspace } from "@/lib/db";
import { disclosures } from "@zveil/db";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { ShareStatementButton, RevokeStatementButton } from "@/components/payments/statement-dialog";
import { exceptions, invLabel, loadLedger, type ReconException } from "@/lib/ledger";
import { Kpi, BigNumber, Panel, SampleTag, ago } from "@/components/dashboard/widgets";
import { AutoRefresh } from "@/components/dashboard/live";
import { ResolveException, ReopenException } from "@/components/payments/resolve";
import { Amount } from "@/components/money/amount";
import { CopyButton } from "@/components/zcash/address-field";
import { EmptyState } from "@/components/feedback/empty-state";
import { truncateAddress, cn } from "@/lib/utils";
import { zatsToZec } from "@z-labs/zip321";
import { ArrowLeftRight, CheckCircle2, FileText } from "lucide-react";

export const metadata = { title: "Payments" };

/* eslint-disable react-hooks/purity -- server component; render-time clocks are fine here */

const KIND: Record<ReconException["kind"], { label: string; tone: string; explain: string }> = {
  overpaid: { label: "Overpaid", tone: "bg-over-bg text-over-fg", explain: "Client sent more than billed." },
  underpaid: { label: "Short & past due", tone: "bg-pending-bg text-pending-fg", explain: "Partial payment and the due date has passed." },
  after_void: { label: "Paid after void", tone: "bg-danger-bg text-danger-fg", explain: "Funds arrived on a voided invoice." },
};

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await connection();
  const now = Date.now();
  const { view } = await searchParams;
  const ws = await workspace();
  const ledger = await loadLedger(ws.id);
  const statements = await db()
    .select()
    .from(disclosures)
    .where(
      and(
        eq(disclosures.workspaceId, ws.id),
        eq(disclosures.kind, "statement"),
        isNull(disclosures.revokedAt),
        gt(disclosures.expiresAt, now),
      ),
    )
    .orderBy(desc(disclosures.createdAt));
  const byId = new Map(ledger.invs.map((i) => [i.id, i]));
  const ex = exceptions(ledger, now);
  const open = ex.filter((e) => !e.resolved);
  const tab = view === "all" ? "all" : open.length || view === "review" ? "review" : "all";

  const pays = [...ledger.pays].sort((a, b) => b.seenAt - a.seenAt);
  const total = pays.reduce((s, p) => s + p.zats, 0);
  const ironwood = pays.filter((p) => p.pool === "ironwood").reduce((s, p) => s + p.zats, 0);
  const confirming = pays.filter((p) => {
    const inv = byId.get(p.invoiceId);
    return inv && p.confirmations < inv.confirmationsRequired;
  }).length;

  return (
    <div className="flex flex-col gap-5">
      <AutoRefresh everyMs={15_000} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink-strong">Payments</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Every shielded payment detected with your viewing key, matched to the invoice it paid.
          </p>
        </div>
        <ShareStatementButton />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total received" hint={`${pays.length} payments`}>
          <Amount zats={total} size="md" />
        </Kpi>
        <Kpi label="Needs review" hint={`${ex.length - open.length} resolved`}>
          <BigNumber>{open.length}</BigNumber>
        </Kpi>
        <Kpi label="Confirming" hint="Waiting on block confirmations">
          <BigNumber>{confirming}</BigNumber>
        </Kpi>
        <Kpi label="Ironwood share" hint="Of value received (NU6.3 pool)">
          <BigNumber>{total ? `${Math.round((ironwood / total) * 100)}%` : "—"}</BigNumber>
        </Kpi>
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        {[
          { id: "review", label: "Reconciliation", count: open.length },
          { id: "all", label: "All payments", count: pays.length },
        ].map((t) => (
          <Link
            key={t.id}
            href={`/app/payments?view=${t.id}`}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-[13px] font-medium transition-colors",
              tab === t.id ? "border-ink-strong text-ink-strong" : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {t.label}
            <span className="tabular rounded-full bg-surface-sunken px-1.5 text-[11px] text-ink-muted">{t.count}</span>
          </Link>
        ))}
      </div>

      {statements.length > 0 && (
        <Panel
          title="Shared income statements"
          description="Signed, period-scoped links you've shared — revoke any time"
          bodyClassName="px-0 pb-1"
        >
          <ul className="divide-y divide-border border-t border-border">
            {statements.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-[13px]">
                <FileText className="size-3.5 text-ink-faint" aria-hidden />
                <span className="font-medium text-ink">{d.label}</span>
                <span className="tabular text-ink-muted">
                  {new Date(d.periodFrom!).toISOString().slice(0, 10)} → {new Date(d.periodTo!).toISOString().slice(0, 10)}
                </span>
                <span className="ml-auto text-xs text-ink-faint">expires in {Math.ceil((d.expiresAt - now) / 86_400_000)}d</span>
                <a href={`/d/${d.token}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Open
                </a>
                <RevokeStatementButton id={d.id} />
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {tab === "review" ? (
        ex.length === 0 ? (
          <Panel title="Reconciliation">
            <EmptyState icon={CheckCircle2} title="All payments reconcile" body="Over, under and late payments land here for a decision." />
          </Panel>
        ) : (
          <div className="flex flex-col gap-3">
            {ex.map((e) => {
              const k = KIND[e.kind];
              return (
                <article
                  key={e.invoice.id}
                  className={cn(
                    "grid gap-4 rounded-xl border bg-surface p-4 shadow-xs md:grid-cols-[1fr_1.2fr]",
                    e.resolved ? "border-border opacity-75" : "border-border",
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", k.tone)}>{k.label}</span>
                      {e.invoice.sample && <SampleTag />}
                      {e.resolved && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-paid-fg">
                          <CheckCircle2 className="size-3" aria-hidden /> Resolved
                        </span>
                      )}
                    </div>
                    <Link href={`/app/invoices/${e.invoice.id}`} className="text-[13px] font-semibold text-ink hover:underline">
                      <span className="font-mono">{invLabel(e.invoice)}</span> · {e.invoice.clientName}
                    </Link>
                    <p className="text-xs text-ink-muted">{k.explain}</p>
                    <dl className="mt-1 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <dt className="text-ink-faint">Billed</dt>
                        <dd className="tabular font-medium text-ink">{zatsToZec(e.invoice.amountZats)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-faint">Received</dt>
                        <dd className="tabular font-medium text-ink">{zatsToZec(e.paid)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-faint">Difference</dt>
                        <dd className={cn("tabular font-semibold", e.delta >= 0 ? "text-over-fg" : "text-pending-fg")}>
                          {e.delta >= 0 ? "+" : "−"}
                          {zatsToZec(Math.abs(e.delta))}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="flex flex-col justify-center border-border md:border-l md:pl-4">
                    {e.resolved ? (
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[13px] text-ink">{e.invoice.reconNote ?? "Resolved without a note"}</div>
                          <div className="mt-0.5 text-xs text-ink-muted">Resolved {ago(e.invoice.reconResolvedAt!, now)}</div>
                        </div>
                        <ReopenException invoiceId={e.invoice.id} />
                      </div>
                    ) : (
                      <ResolveException invoiceId={e.invoice.id} kind={e.kind} />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : (
        <Panel title="Ledger" description="Newest first · amounts in ZEC" bodyClassName="px-0 pb-1">
          {pays.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No payments yet"
              body="Send an invoice link and pay it from a testnet wallet — it appears here within a block."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[13px]">
                <thead>
                  <tr className="border-y border-border bg-paper text-left text-[11px] uppercase tracking-[0.05em] text-ink-faint">
                    <th className="px-5 py-2 font-medium">Detected</th>
                    <th className="px-3 py-2 font-medium">Invoice</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Pool</th>
                    <th className="px-3 py-2 font-medium">Transaction</th>
                    <th className="px-5 py-2 text-right font-medium">Confirmations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pays.map((p) => {
                    const inv = byId.get(p.invoiceId)!;
                    const done = p.confirmations >= inv.confirmationsRequired;
                    return (
                      <tr key={p.id} className="hover:bg-surface-hover">
                        <td className="whitespace-nowrap px-5 py-2.5 text-ink-soft">{ago(p.seenAt, now)}</td>
                        <td className="px-3 py-2.5">
                          <Link href={`/app/invoices/${inv.id}`} className="flex items-center gap-2 hover:underline">
                            <span className="font-mono text-ink-soft">{invLabel(inv)}</span>
                            <span className="truncate font-medium text-ink">{inv.clientName}</span>
                            {inv.sample && <SampleTag />}
                          </Link>
                        </td>
                        <td className="tabular px-3 py-2.5 text-right font-semibold text-ink">+{zatsToZec(p.zats)}</td>
                        <td className="px-3 py-2.5">
                          <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[11px] font-medium capitalize text-ink-soft">
                            {p.pool}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-1">
                            <span className="font-mono text-xs text-ink-muted" title={p.txid}>
                              {truncateAddress(p.txid, 8, 6)}
                            </span>
                            <CopyButton value={p.txid} />
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <span
                            className={cn(
                              "tabular inline-flex items-center gap-1.5 text-xs font-medium",
                              done ? "text-paid-fg" : "text-pending-fg",
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full", done ? "bg-paid-fg" : "animate-breathe bg-pending-fg")} />
                            {done ? `Confirmed · ${p.confirmations}` : `${p.confirmations}/${inv.confirmationsRequired}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

export const instant = false;
