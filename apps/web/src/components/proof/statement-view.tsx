import { Download, Eye, FileText } from "lucide-react";
import { ZveilWordmark } from "@/components/ui/logo";
import { Banner } from "@/components/feedback/empty-state";
import { ProofCode } from "@/components/proof/proof-code";
import { zatsToZec } from "@z-labs/zip321";
import { truncateAddress } from "@/lib/utils";
import { formatUsd, isoDay, type buildStatement } from "@/lib/statement";

type Statement = Awaited<ReturnType<typeof buildStatement>>;

const fmtDay = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function StatementView({
  s,
  label,
  from,
  to,
  expiresAt,
  csvHref,
}: {
  s: Statement;
  label: string;
  from: number;
  to: number;
  expiresAt: number;
  csvHref: string;
}) {
  const pools = [...new Set(s.rows.map((r) => r.pool))];
  return (
    <div className="veil-bg flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-[760px] items-center justify-between px-4 py-5">
        <ZveilWordmark />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
          <Eye className="size-3" aria-hidden /> Private disclosure — {label}
        </span>
      </header>
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pb-16">
        <Banner tone="info" title="Period-scoped view" className="mb-4">
          This link shows only payments {s.workspace.businessName} received between {fmtDay(from)} and {fmtDay(to)}.
          No balances, addresses, or other activity in the wallet are visible.
        </Banner>
        {s.sample && (
          <Banner tone="warn" title="Contains sandbox sample data" className="mb-4">
            Rows marked Sample are illustrative and were never on-chain.
          </Banner>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-md">
          <div className="h-[3px] w-full bg-brand-600" />
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-5">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-600">
                <FileText className="size-3.5" aria-hidden /> Income statement
              </div>
              <h1 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-ink-strong">{s.workspace.businessName}</h1>
              <p className="mt-0.5 text-sm text-ink-muted">
                {fmtDay(from)} – {fmtDay(to)} · Zcash {s.workspace.network}
              </p>
            </div>
            <a
              href={csvHref}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs font-medium text-ink-soft shadow-xs transition hover:border-border-strong hover:text-ink"
            >
              <Download className="size-3.5" aria-hidden /> Download CSV
            </a>
          </div>

          <dl className="mt-5 grid grid-cols-2 border-y border-border sm:grid-cols-4">
            {[
              ["Received", `${zatsToZec(s.zats)} ZEC`],
              ["USD at receipt", s.usdCents == null ? "—" : formatUsd(s.usdCents)],
              ["Payments", String(s.rows.length)],
              ["Pools", pools.length ? pools.join(", ") : "—"],
            ].map(([k, v]) => (
              <div key={k} className="border-border px-6 py-3 [&:not(:last-child)]:border-r">
                <dt className="text-[11px] text-ink-muted">{k}</dt>
                <dd className="tabular mt-0.5 text-[15px] font-semibold capitalize text-ink-strong">{v}</dd>
              </div>
            ))}
          </dl>

          {s.rows.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-ink-muted">No payments were received in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-paper text-left text-[11px] uppercase tracking-[0.05em] text-ink-faint">
                    <th className="px-6 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Invoice</th>
                    <th className="px-3 py-2 font-medium">Client</th>
                    <th className="px-3 py-2 text-right font-medium">ZEC</th>
                    <th className="px-3 py-2 text-right font-medium">USD</th>
                    <th className="px-6 py-2 font-medium">Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {s.rows.map((r) => (
                    <tr key={r.txid}>
                      <td className="whitespace-nowrap px-6 py-2.5 text-ink-soft">{isoDay(r.at)}</td>
                      <td className="px-3 py-2.5 font-mono text-ink-soft">{r.invoice}</td>
                      <td className="px-3 py-2.5 text-ink">
                        {r.client}
                        {r.sample && <span className="ml-1.5 text-[10px] uppercase text-ink-faint">Sample</span>}
                      </td>
                      <td className="tabular px-3 py-2.5 text-right font-medium text-ink">{zatsToZec(r.zats)}</td>
                      <td className="tabular px-3 py-2.5 text-right text-ink-soft">
                        {r.usdCents == null ? "—" : formatUsd(r.usdCents)}
                      </td>
                      <td className="px-6 py-2.5 font-mono text-xs text-ink-muted" title={r.txid}>
                        {truncateAddress(r.txid, 8, 6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ProofCode code={s.proof} title="Signed statement" />
        </div>

        <p className="mt-5 text-center text-[11px] leading-4 text-ink-faint">
          USD values use the ZEC/USD rate at the moment each payment was detected. This link expires{" "}
          {new Date(expiresAt).toLocaleDateString()} and can be revoked by the sender at any time.
        </p>
      </main>
    </div>
  );
}
