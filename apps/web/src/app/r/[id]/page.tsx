import { connection } from "next/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { invoices, payments, workspaces } from "@zveil/db";
import { and, eq, isNull } from "drizzle-orm";
import { signProof } from "@/lib/receipt";
import { ProofCode } from "@/components/proof/proof-code";
import { ZveilWordmark } from "@/components/ui/logo";
import { Amount } from "@/components/money/amount";
import { CopyButton } from "@/components/zcash/address-field";
import { truncateAddress } from "@/lib/utils";
import { zatsToZec } from "@z-labs/zip321";
import { ShieldCheck } from "lucide-react";

/* eslint-disable react-hooks/purity -- server component; render-time clocks are fine here */

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const [inv] = await db().select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!inv || (inv.status !== "paid" && inv.status !== "overpaid")) notFound();
  const pays = await db().select().from(payments).where(and(eq(payments.invoiceId, id), isNull(payments.reorgedAt)));
  const [ws] = await db().select().from(workspaces).where(eq(workspaces.id, inv.workspaceId)).limit(1);
  const total = pays.reduce((s, p) => s + p.zats, 0);
  const paidAt = new Date(inv.paidAt ?? Date.now());

  const code = signProof({
    t: "receipt",
    v: 1,
    network: ws.network,
    invoice: `INV-${String(inv.seq ?? 0).padStart(4, "0")}`,
    paidAt: paidAt.toISOString(),
    zats: total,
    ...(inv.amountFiatCents ? { fiat: `USD ${(inv.amountFiatCents / 100).toFixed(2)}` } : {}),
    txids: pays.map((p) => p.txid),
    recipient: ws.businessName,
    ...(inv.sample ? { sample: true } : {}),
  });

  const rows = [
    ["Invoice", `INV-${String(inv.seq ?? 0).padStart(4, "0")}`],
    ["Paid at", paidAt.toLocaleString()],
    ["Received", `${zatsToZec(total)} ZEC`],
    ...(inv.amountFiatCents ? [["Fiat equivalent", `$${(inv.amountFiatCents / 100).toFixed(2)} USD`]] : []),
    ["Recipient", ws.businessName],
    ["Network", `Zcash ${ws.network} · shielded`],
  ] as const;

  return (
    <div className="veil-bg flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-[520px] justify-center px-4 py-6">
        <ZveilWordmark />
      </header>
      <main className="mx-auto w-full max-w-[520px] flex-1 px-4 pb-16">
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="h-[3px] w-full bg-paid-fg" />
          <div className="px-6 py-6 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-paid-bg text-paid-fg">
              <ShieldCheck className="size-6" strokeWidth={1.8} aria-hidden />
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-ink-strong">Payment receipt</h1>
            <p className="mt-1 text-sm text-ink-muted">Verified by Zveil — signature below</p>
            <div className="mt-5">
              <Amount zats={total} size="hero" fiat={inv.amountFiatCents ? inv.amountFiatCents / 100 : null} />
            </div>
          </div>
          <div className="border-t border-border">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-border px-6 py-3 text-sm last:border-0">
                <span className="text-ink-muted">{k}</span>
                <span className="font-medium text-ink">{v}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-6 py-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-muted">
              Transaction hashes
            </div>
            <div className="mt-2 space-y-1.5">
              {pays.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs text-ink-soft" title={p.txid}>
                    {truncateAddress(p.txid, 10, 8)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium capitalize text-ink-muted">
                      {p.pool}
                    </span>
                    <CopyButton value={p.txid} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ProofCode code={code} title="Signed receipt" />
        </div>
        <p className="mt-5 text-center text-[11px] leading-4 text-ink-faint">
          Zveil signatures verify the invoice was paid. Payment details remain private to the
          invoice — no address history is exposed by this receipt.
        </p>
      </main>
    </div>
  );
}

// Data comes from SQLite/scanner at request time — never prerender.
export const instant = false;
