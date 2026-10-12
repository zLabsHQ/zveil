"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BadgeCheck, FileText, ShieldAlert } from "lucide-react";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

const ROWS = [
  { date: "Jul 14", inv: "INV-0003", zec: "1.20", usd: "$1,402" },
  { date: "Aug 02", inv: "INV-0004", zec: "0.85", usd: "$1,021" },
  { date: "Sep 21", inv: "INV-0006", zec: "2.15", usd: "$2,758" },
];

const BULLETS = [
  "Only the payments in the period — never balances or other wallet activity",
  "USD value captured at the moment each payment arrived",
  "Expiring, revocable link, plus a CSV your accountant can open",
  "A signed proof code anyone can check — offline, without an account",
];

export function ProofSection() {
  const [tampered, setTampered] = useState(false);
  const total = tampered ? "42.00" : "4.20";

  return (
    <section className="scroll-mt-16 border-y border-border bg-surface py-14 sm:py-24">
      <div className="mx-auto grid max-w-[1200px] items-center gap-9 px-4 sm:gap-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <div className="max-w-[500px]">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">The wedge: proof</div>
            <h2 className="mt-2 text-[26px] font-semibold leading-8 tracking-[-0.02em] text-ink-strong sm:text-[40px] sm:leading-[1.1]">
              Prove what you earned.{" "}
              <span className="font-serif italic font-normal text-brand-600">Nothing else.</span>
            </h2>
            <p className="mt-4 text-base leading-6 text-ink-soft">
              Shielded money is private by default — which makes it hard to show a grant committee or an
              accountant. Zveil turns viewing keys into scoped, signed statements.
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:gap-3">
              {BULLETS.map((b) => (
                <li key={b} className="flex gap-2.5 text-sm leading-5 text-ink-soft">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-paid-fg" strokeWidth={2} aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
            <Link
              href="/verify"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:mt-7"
            >
              Verify a proof yourself
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="relative">
            <div className="rounded-xl border border-border bg-paper shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                    <FileText className="size-4" strokeWidth={1.8} aria-hidden />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink-strong">Income statement · Q3</div>
                    <div className="text-xs text-ink-muted">Prepared for Zcash Community Grants</div>
                  </div>
                </div>
                <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                  Illustrative
                </span>
              </div>
              <div className="divide-y divide-border px-5">
                {ROWS.map((r) => (
                  <div key={r.inv} className="flex items-center gap-4 py-2.5 text-[13px]">
                    <span className="w-14 text-ink-muted">{r.date}</span>
                    <span className="flex-1 font-mono text-xs text-ink-soft">{r.inv}</span>
                    <span className="tabular w-20 text-right font-medium text-ink">+{r.zec} ZEC</span>
                    <span className="tabular w-16 text-right text-ink-muted">{r.usd}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-3">
                  <span className="text-[13px] font-semibold text-ink">Total received</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={total}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className={cn("tabular text-base font-semibold", tampered ? "text-danger-fg" : "text-ink-strong")}
                    >
                      {total} ZEC
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <motion.div
              layout
              className={cn(
                "relative -mt-3 ml-6 rounded-xl border p-4 shadow-md transition-colors duration-300 sm:ml-10",
                tampered ? "border-danger-fg/30 bg-danger-bg" : "border-paid-fg/25 bg-paid-bg",
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-surface", tampered ? "text-danger-fg" : "text-paid-fg")}>
                  {tampered ? <ShieldAlert className="size-4" strokeWidth={2} aria-hidden /> : <BadgeCheck className="size-4" strokeWidth={2} aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tampered ? "bad" : "ok"}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className={cn("text-sm font-semibold", tampered ? "text-danger-fg" : "text-paid-fg")}>
                        {tampered ? "Not valid — signature does not match" : "Valid — signed by Zveil"}
                      </div>
                      <div className="mt-0.5 text-xs text-ink-soft">
                        {tampered
                          ? "Changing a single digit breaks the Ed25519 signature."
                          : "Zveil observed these payments with the recipient's viewing key."}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  <div className="mt-2 truncate rounded-md bg-surface/70 px-2.5 py-1.5 font-mono text-[11px] text-ink-muted">
                    zv1.eyJ0Ijoic3RhdGVtZW50IiwidiI6MSwi…
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTampered((v) => !v)}
                  className="shrink-0 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink shadow-xs transition hover:border-border-strong"
                >
                  {tampered ? "Restore" : "Tamper with it"}
                </button>
              </div>
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
