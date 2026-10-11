"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Amount } from "@/components/money/amount";
import { StatusBadge, type InvoiceStatus } from "@/components/status/status-badge";
import { ConfirmationRing } from "@/components/status/confirmation-ring";
import { QrCode } from "@/components/zcash/qr-code";
import { CopyButton } from "@/components/zcash/address-field";
import { ZveilWordmark } from "@/components/ui/logo";
import { cn, truncateAddress } from "@/lib/utils";
import { FAUCET_URL } from "@/lib/network";
import { Wallet, Fingerprint, ReceiptText, Check } from "lucide-react";
import Link from "next/link";

export interface PayViewProps {
  invoiceId: string;
  slug: string;
  businessName: string;
  seqLabel: string;
  clientNote: string;
  dueLabel: string | null;
  amountZats: number;
  fiat: string | null;
  fiatAmount: number | null;
  address: string;
  zip321Uri: string;
  required: number;
  initialStatus: string;
  paidZats: number;
  demoMode: boolean;
}

type LiveStatus = { status: string; paidZats: number; confirmations: number };

function badgeOf(s: string): InvoiceStatus {
  const m: Record<string, InvoiceStatus> = { partially_paid: "partial" };
  return (m[s] ?? s) as InvoiceStatus;
}

export function PayView(p: PayViewProps) {
  const [live, setLive] = useState<LiveStatus>({
    status: p.initialStatus,
    paidZats: p.paidZats,
    confirmations: 0,
  });
  const [demoBusy, setDemoBusy] = useState(false);

  useEffect(() => {
    const es = new EventSource(`/api/invoices/${p.slug}/stream?by=slug`);
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data) as {
          type: string;
          status?: string;
          payment?: { zats: number; confirmations?: number };
        };
        if (d.type === "status" && d.status) {
          setLive((v) => ({ ...v, status: d.status! }));
        }
        if (d.type === "payment" && d.payment) {
          setLive((v) => ({
            ...v,
            paidZats: v.paidZats + (d.payment!.confirmations ? 0 : d.payment!.zats),
            confirmations: Math.max(v.confirmations, d.payment!.confirmations ?? 0),
          }));
        }
      } catch {
        /* keep stream */
      }
    };
    return () => es.close();
  }, [p.slug]);

  // Polling fallback: SSE emits are same-process only, so on multi-instance
  // deployments the push can miss. Poll the invoice API until terminal state.
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`/api/pay/${p.slug}/status`, { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as { status: string; paidZats: number; confirmations: number };
        setLive((v) => ({
          status: d.status,
          paidZats: d.paidZats || v.paidZats,
          confirmations: Math.max(v.confirmations, d.confirmations),
        }));
      } catch {
        /* next tick */
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [p.slug]);

  const paid = live.status === "paid" || live.status === "overpaid";
  const confirming = !paid && live.status !== "open" && live.status !== "void" && live.status !== "draft";
  const partial = live.status === "partially_paid";

  return (
    <div className="veil-bg flex flex-1 flex-col">
      {/* top strip */}
      <header className="mx-auto flex w-full max-w-[480px] items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-soft">
          <div className="flex size-6 items-center justify-center rounded-full bg-ink-strong text-[9px] font-semibold text-white">
            {p.businessName.slice(0, 2).toUpperCase()}
          </div>
          {p.businessName}
        </div>
        <div className="text-xs text-ink-muted">via <ZveilWordmark className="inline-flex" /> </div>
      </header>

      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pb-16">
        <motion.div layout className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="h-[3px] w-full bg-brand-600" />
          <div className="flex items-center justify-between px-6 pt-5">
            <div>
              <div className="text-sm font-semibold text-ink">{p.seqLabel}</div>
              <div className="text-xs text-ink-muted">
                {p.clientNote}
                {p.dueLabel && ` · Due ${p.dueLabel}`}
              </div>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={live.status}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <StatusBadge status={badgeOf(live.status)} />
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="px-6 pt-5">
            <Amount
              zats={p.amountZats}
              fiat={p.fiatAmount}
              size="hero"
            />
            {partial && (
              <div className="mt-1 text-xs text-pending-fg">
                {((p.amountZats - live.paidZats) / 1e8).toFixed(4)} ZEC still due
              </div>
            )}
            {live.status === "overpaid" && (
              <div className="mt-1 text-xs text-over-fg">
                Overpaid by {((live.paidZats - p.amountZats) / 1e8).toFixed(4)} ZEC — receipt shows total received
              </div>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {paid ? (
              <motion.div
                key="paid"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mx-6 mt-5 flex flex-col items-center gap-3 rounded-lg border border-paid-fg/20 bg-paid-bg/60 px-4 py-6"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex size-14 items-center justify-center rounded-full bg-paid-bg text-paid-fg"
                >
                  <Check className="size-7" strokeWidth={2.5} aria-hidden />
                </motion.div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-ink-strong">Payment confirmed — thank you</div>
                  <div className="mt-0.5 text-xs text-ink-muted">
                    This receipt is verifiable without revealing your transaction details.
                  </div>
                </div>
                <a
                  href={`/r/${p.invoiceId}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-surface-hover"
                >
                  <ReceiptText className="size-4" strokeWidth={1.8} aria-hidden /> View receipt
                </a>
              </motion.div>
            ) : (
              <motion.div
                key="pay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mx-6 mt-5 flex flex-col items-center gap-4"
              >
                <div className="relative rounded-lg border border-border bg-surface p-3">
                  <QrCode value={p.zip321Uri} size={180} />
                </div>
                <a
                  href={p.zip321Uri}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink-strong text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#292524]"
                >
                  <Wallet className="size-4" strokeWidth={1.8} aria-hidden /> Open in wallet
                </a>
                <div className="flex w-full items-center gap-2">
                  <div className="flex h-9 flex-1 items-center justify-between gap-2 rounded-md border border-border bg-surface-sunken px-3">
                    <span className="truncate font-mono text-[12px] text-ink">{truncateAddress(p.address)}</span>
                    <CopyButton value={p.address} />
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700">
                    <Fingerprint className="size-3" aria-hidden /> unique to this invoice
                  </span>
                </div>
                {partial && (
                  <div className="w-full rounded-md border border-pending-fg/20 bg-pending-bg px-3 py-2 text-xs text-pending-fg">
                    Partial payment received — the remainder is still due before this invoice is settled.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* live status footer */}
          <div className="mx-6 mt-5 border-t border-border py-3.5" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={paid ? "paid" : confirming ? `c${Math.min(live.confirmations, p.required)}` : "wait"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 text-xs"
              >
                {paid ? (
                  <>
                    <span className="size-2 rounded-full bg-paid-fg" />
                    <span className="font-medium text-ink">Paid · receipt ready</span>
                  </>
                ) : confirming ? (
                  <>
                    <ConfirmationRing confirmed={Math.min(live.confirmations || 1, p.required)} required={p.required} size={18} />
                    <span className="font-medium text-ink">
                      Confirming · {Math.min(live.confirmations || 1, p.required)}/{p.required} confirmations
                    </span>
                  </>
                ) : (
                  <>
                    <span className="size-2 animate-breathe rounded-full bg-open-fg" />
                    <span className="font-medium text-ink">Waiting for payment</span>
                    <span className="ml-auto text-ink-muted">Live — no refresh needed</span>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* trust footer */}
        <div className="mt-6 flex flex-col items-center gap-1.5 text-center">
          <div className="text-xs font-medium text-ink-soft">Paid with Zcash shielded addresses</div>
          <div className="text-[11px] leading-4 text-ink-faint">
            Zveil is non-custodial and only sees a viewing key.<br />
            On testnet? Pay with Zashi, Zingo or YWallet — free tZEC from the{" "}
            <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="underline">
              faucet
            </a>
            .<br />
            Powered by Zveil ·{" "}
            <Link href="/" className="underline">zveil.zlabs.tech</Link>
          </div>
          {p.demoMode && (
            <button
              type="button"
              disabled={demoBusy || paid}
              onClick={async () => {
                setDemoBusy(true);
                await fetch(`/api/demo/pay/${p.slug}`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
                setDemoBusy(false);
              }}
              className={cn(
                "mt-4 rounded-md border border-dashed border-border px-3 py-1.5 text-[11px] font-medium text-ink-faint transition-colors hover:text-ink-muted cursor-pointer",
                paid && "opacity-40",
              )}
            >
              demo: simulate wallet payment
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
