"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Amount } from "@/components/money/amount";
import { StatusBadge } from "@/components/status/status-badge";
import { ConfirmationRing } from "@/components/status/confirmation-ring";
import { QrCode } from "@/components/zcash/qr-code";
import { ZveilMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { Fingerprint, Wallet } from "lucide-react";

const DEMO_ADDRESS = "uregtest1zkuzfv5m3yhv2j4fmvq5rjurkxenxyq8r7h4daun2zkznrjaa8ra8asgdm8wwgwjvl";
const DEMO_URI = `zcash:${DEMO_ADDRESS}?amount=2.5&message=INV-0007`;
const REQUIRED = 3;

type Phase = "open" | "seen" | "c1" | "c2" | "c3" | "paid";

const TIMELINE: [Phase, number][] = [
  ["open", 2200],
  ["seen", 1100],
  ["c1", 750],
  ["c2", 750],
  ["c3", 650],
  ["paid", 2600],
];

const confirmedOf: Record<Phase, number> = {
  open: 0,
  seen: 0,
  c1: 1,
  c2: 2,
  c3: 3,
  paid: REQUIRED,
};

export function PayCardDemo({ className }: { className?: string }) {
  const [phase, setPhase] = useState<Phase>("open");
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const [p, wait] = TIMELINE[i];
      setPhase(p);
      i = (i + 1) % TIMELINE.length;
      t = setTimeout(tick, wait);
    };
    t = setTimeout(tick, TIMELINE[0][1]);
    return () => clearTimeout(t);
  }, [reduced]);

  const paid = phase === "paid";
  const confirming = phase === "seen" || phase === "c1" || phase === "c2" || phase === "c3";

  return (
    <div className={cn("relative w-full max-w-[420px]", className)}>
      {/* soft backdrop */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[32px] veil-bg opacity-80"
      />
      <motion.div
        layout
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-surface shadow-lg transition-colors duration-500",
        )}
      >
        {paid && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-paid-bg/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.4] }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        )}

        {/* accent edge + header */}
        <div className="h-[3px] w-full bg-brand-600" />
        <div className="flex items-center justify-between px-6 pt-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-ink-strong text-[11px] font-semibold text-white">
              ML
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">Maya Lin Studio</div>
              <div className="text-xs text-ink-muted">Invoice INV-0007 · Due Oct 20</div>
            </div>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={phase}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <StatusBadge
                status={paid ? "paid" : confirming ? "seen" : "open"}
              />
            </motion.span>
          </AnimatePresence>
        </div>

        {/* amount */}
        <div className="px-6 pt-5">
          <Amount zats={250_000_000} fiat={142.8} size="hero" />
        </div>

        {/* pay zone */}
        <AnimatePresence mode="wait" initial={false}>
          {paid ? (
            <motion.div
              key="paid"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mx-6 mt-5 flex flex-col items-center gap-3 rounded-lg border border-paid-fg/20 bg-paid-bg/60 px-4 py-6"
            >
              <ConfirmationRing confirmed={REQUIRED} required={REQUIRED} size={56} />
              <div className="text-center">
                <div className="text-sm font-semibold text-ink-strong">Payment confirmed</div>
                <div className="mt-0.5 font-mono text-xs text-paid-fg">txid a3f1…9d2e · block 3,512,044</div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pay"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mx-6 mt-5 flex flex-col items-center gap-4"
            >
              <div className="relative rounded-lg border border-border bg-surface p-3">
                <QrCode value={DEMO_URI} size={144} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-md bg-surface p-1">
                    <ZveilMark size={22} />
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink-strong text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#292524] cursor-pointer"
              >
                <Wallet className="size-4" strokeWidth={1.8} aria-hidden />
                Open in wallet
              </button>
              <div className="flex w-full items-center gap-2 font-mono text-[11px] text-ink-muted">
                <span className="truncate">u1q7x…k9w7</span>
                <span className="mx-auto inline-flex items-center gap-1 font-sans text-[11px] font-medium text-brand-700">
                  <Fingerprint className="size-3" strokeWidth={1.8} aria-hidden />
                  Unique address for this invoice
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* live status footer */}
        <div className="mx-6 mt-5 border-t border-border py-3.5" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={paid ? "paid-status" : confirming ? "confirming" : "waiting"}
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
                  <ConfirmationRing confirmed={confirmedOf[phase]} required={REQUIRED} size={18} />
                  <span className="font-medium text-ink">
                    Confirming · {Math.min(confirmedOf[phase], REQUIRED)}/{REQUIRED} confirmations
                  </span>
                </>
              ) : (
                <>
                  <span className="size-2 rounded-full bg-open-fg animate-breathe" />
                  <span className="font-medium text-ink">Waiting for payment</span>
                  <span className="ml-auto text-ink-muted">Updates live — no refresh needed</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
