"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Check, FileText, Layers, Radio, Send, BadgeCheck, type LucideIcon } from "lucide-react";
import { Reveal } from "./reveal";
import { LiveStrip } from "./live-strip";
import { cn } from "@/lib/utils";

type Step = { icon: LucideIcon; title: string; detail: string; tone: string };

const STEPS: Step[] = [
  { icon: FileText, title: "Invoice created", detail: "for Orbit Collective", tone: "bg-surface-sunken text-ink-muted" },
  { icon: Send, title: "Issued as INV-0007", detail: "unique shielded address · diversifier #7", tone: "bg-brand-50 text-brand-600" },
  { icon: Radio, title: "Payment detected", detail: "+2.5 ZEC · orchard · tx 9f3a…c21b", tone: "bg-pending-bg text-pending-fg" },
  { icon: Layers, title: "Confirmed in block #4,492,610", detail: "3 confirmations", tone: "bg-brand-50 text-brand-600" },
  { icon: Check, title: "Paid in full", detail: "reconciled automatically", tone: "bg-paid-bg text-paid-fg" },
  { icon: BadgeCheck, title: "Signed receipt issued", detail: "zv1.eyJ0IjoicmVjZWlwdCIs…", tone: "bg-paid-bg text-paid-fg" },
];

export function Showcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const t = setInterval(() => setN((v) => (v >= STEPS.length + 2 ? 0 : v + 1)), 1100);
    return () => clearInterval(t);
  }, [inView, reduced]);

  const shown = reduced ? STEPS.length : Math.min(n, STEPS.length);
  const paid = shown >= 5;

  return (
    <section className="scroll-mt-16 py-14 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <Reveal>
          <div className="mx-auto max-w-[640px] text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">The engine</div>
            <h2 className="mt-2 text-[26px] font-semibold leading-8 tracking-[-0.02em] text-ink-strong sm:text-[40px] sm:leading-[1.1]">
              Watch an invoice <span className="font-serif italic font-normal text-brand-600">reconcile itself</span>
            </h2>
            <p className="mt-4 text-base leading-6 text-ink-soft">
              From a shielded address to a signed receipt, every step observed through a view-only key — no
              copy-pasting, no “did you send it?”.
            </p>
            <div className="mt-6 flex justify-center">
              <LiveStrip />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div ref={ref} className="mx-auto mt-9 max-w-[980px] sm:mt-12">
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
              <div className="flex items-center gap-2 border-b border-border bg-paper px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-border-strong" />
                <span className="size-2.5 rounded-full bg-border-strong" />
                <span className="size-2.5 rounded-full bg-border-strong" />
                <span className="ml-3 flex-1 truncate rounded-md bg-surface-sunken px-3 py-1 text-center font-mono text-[11px] text-ink-muted">
                  zveil.zlabs.tech/app/invoices/INV-0007
                </span>
              </div>

              <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[0.85fr_1.15fr]">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-semibold text-ink-strong">INV-0007</span>
                      <motion.span
                        key={paid ? "paid" : "open"}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          paid ? "bg-paid-bg text-paid-fg" : shown >= 3 ? "bg-pending-bg text-pending-fg" : "bg-brand-50 text-brand-700",
                        )}
                      >
                        {paid ? "Paid" : shown >= 3 ? "Confirming" : "Open"}
                      </motion.span>
                    </div>
                    <div className="mt-0.5 text-sm text-ink-muted">Orbit Collective</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-paper p-3.5">
                      <div className="text-[11px] uppercase tracking-[0.05em] text-ink-faint">Total due</div>
                      <div className="mt-1 text-xl font-semibold text-ink-strong">
                        2.5 <span className="text-xs font-medium text-ink-muted">ZEC</span>
                      </div>
                      <div className="text-[11px] text-ink-muted">≈ $3,084</div>
                    </div>
                    <div className="rounded-lg border border-border bg-paper p-3.5">
                      <div className="text-[11px] uppercase tracking-[0.05em] text-ink-faint">Received</div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={shown >= 3 ? "r" : "z"}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                          className={cn("mt-1 text-xl font-semibold", shown >= 3 ? "text-paid-fg" : "text-ink-faint")}
                        >
                          {shown >= 3 ? "2.5" : "0"} <span className="text-xs font-medium text-ink-muted">ZEC</span>
                        </motion.div>
                      </AnimatePresence>
                      <div className="text-[11px] text-ink-muted">{shown >= 3 ? "1 payment" : "waiting…"}</div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-paper p-3.5">
                    <div className="text-[11px] uppercase tracking-[0.05em] text-ink-faint">Payment address · unique to this invoice</div>
                    <div className="mt-1.5 truncate font-mono text-xs text-ink">u1q7xk4m9d2zv3…8wk9w7</div>
                  </div>
                </div>

                <div className="rounded-lg border border-border">
                  <div className="border-b border-border px-4 py-3">
                    <div className="text-sm font-semibold text-ink">Timeline</div>
                    <div className="text-xs text-ink-muted">Observed end-to-end through the viewing key</div>
                  </div>
                  <ol className="px-4 py-4">
                    {STEPS.map((s, i) => {
                      const on = i < shown;
                      return (
                        <li key={s.title} className="relative flex gap-3 pb-4 last:pb-0">
                          {i < STEPS.length - 1 && (
                            <span
                              aria-hidden
                              className={cn("absolute left-[11px] top-6 bottom-0 w-px transition-colors duration-500", i < shown - 1 ? "bg-border-strong" : "bg-border")}
                            />
                          )}
                          <motion.span
                            animate={{ scale: on ? 1 : 0.85, opacity: on ? 1 : 0.35 }}
                            transition={{ type: "spring", stiffness: 400, damping: 22 }}
                            className={cn("relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full", on ? s.tone : "bg-surface-sunken text-ink-faint")}
                          >
                            <s.icon className="size-3.5" strokeWidth={2} aria-hidden />
                          </motion.span>
                          <motion.div
                            animate={{ opacity: on ? 1 : 0.3, x: on ? 0 : -4 }}
                            transition={{ duration: 0.35 }}
                            className="min-w-0 pt-0.5"
                          >
                            <div className="text-[13px] font-medium text-ink">{s.title}</div>
                            <div className="truncate font-mono text-[11px] text-ink-muted">{s.detail}</div>
                          </motion.div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-ink-faint">
              Illustrative replay of a real flow — in the app, every row comes from the live scanner event log.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
