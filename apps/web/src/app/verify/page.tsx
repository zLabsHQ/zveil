import { connection } from "next/server";
import Link from "next/link";
import { BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { ZveilWordmark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { verifyProof, type Proof } from "@/lib/receipt";
import { zatsToZec } from "@z-labs/zip321";
import { truncateAddress } from "@/lib/utils";

export const metadata = { title: "Verify a proof" };

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function fields(p: Proof): [string, string][] {
  const common: [string, string][] = [
    ["Issued to", p.recipient],
    ["Amount received", `${zatsToZec(p.zats)} ZEC`],
    ["Network", `Zcash ${p.network}`],
  ];
  if (p.t === "receipt")
    return [
      ["Type", "Payment receipt"],
      ["Invoice", p.invoice],
      ...common,
      ...(p.fiat ? ([["Invoiced in fiat", p.fiat]] as [string, string][]) : []),
      ["Paid at", new Date(p.paidAt).toUTCString()],
    ];
  return [
    ["Type", "Income statement"],
    ["Period", `${fmtDay(p.from)} – ${fmtDay(p.to)}`],
    ...common,
    ["USD at receipt", p.usdCents == null ? "—" : (p.usdCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })],
    ["Payments", String(p.count)],
  ];
}

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  await connection();
  const { r } = await searchParams;
  const code = r?.trim() ?? "";
  const result = code ? verifyProof(code) : null;

  return (
    <div className="veil-bg flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-[600px] justify-center px-4 py-6">
        <Link href="/">
          <ZveilWordmark />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[600px] flex-1 px-4 pb-16">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand-600">
            <BadgeCheck className="size-3.5" aria-hidden /> Proof verifier
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink-strong">Verify a Zveil receipt or statement</h1>
          <p className="mt-1.5 text-sm leading-6 text-ink-soft">
            Paste a <span className="font-mono">zv1…</span> code from a receipt, statement, or CSV. Verification checks
            Zveil&apos;s signature — it reveals nothing beyond what the code already contains.
          </p>
          <form action="/verify" method="get" className="mt-4 flex flex-col gap-3">
            <textarea
              name="r"
              rows={4}
              defaultValue={code}
              placeholder="zv1.eyJ0Ijoi…"
              spellCheck={false}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-faint focus:border-brand-300 focus:outline-none"
            />
            <Button type="submit" className="self-start">
              Verify
            </Button>
          </form>
        </div>

        {result && !result.ok && (
          <div className="mt-4 flex gap-3 rounded-xl border border-danger-fg/20 bg-danger-bg p-5">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger-fg" aria-hidden />
            <div>
              <div className="text-sm font-semibold text-danger-fg">Not valid</div>
              <p className="mt-0.5 text-sm text-ink-soft">{result.reason}</p>
            </div>
          </div>
        )}

        {result?.ok && (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-md">
            <div className="h-[3px] w-full bg-paid-fg" />
            <div className="flex items-center gap-3 px-6 py-4">
              <span className="flex size-9 items-center justify-center rounded-full bg-paid-bg text-paid-fg">
                <ShieldCheck className="size-5" strokeWidth={1.8} aria-hidden />
              </span>
              <div>
                <div className="text-sm font-semibold text-ink-strong">Valid — signed by Zveil</div>
                <div className="text-xs text-ink-muted">The contents below have not been altered since issue.</div>
              </div>
            </div>
            {result.proof.sample && (
              <div className="border-t border-border bg-pending-bg px-6 py-2.5 text-xs text-pending-fg">
                Contains sandbox sample data — illustrative, never on-chain.
              </div>
            )}
            <dl className="border-t border-border">
              {fields(result.proof).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 border-b border-border px-6 py-2.5 text-sm last:border-0">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="tabular text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            {result.proof.txids.length > 0 && (
              <div className="border-t border-border px-6 py-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                  Shielded transactions ({result.proof.txids.length})
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  {result.proof.txids.map((t) => (
                    <span key={t} className="font-mono text-xs text-ink-soft" title={t}>
                      {truncateAddress(t, 12, 10)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-5 text-center text-[11px] leading-4 text-ink-faint">
          A valid signature means Zveil observed these shielded payments using the recipient&apos;s viewing key. Anyone
          holding that viewing key can independently confirm the transactions on-chain. Public key:{" "}
          <a href="/api/proofs/key" className="font-mono underline underline-offset-2">
            /api/proofs/key
          </a>
        </p>
      </main>
    </div>
  );
}

// Verifies per request — never prerender.
export const instant = false;
