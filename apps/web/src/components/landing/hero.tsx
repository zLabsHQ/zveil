import { PayCardDemo } from "./pay-card";
import { Reveal } from "./reveal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BadgeCheck, FileCheck2, KeyRound, Layers, ShieldCheck } from "lucide-react";

const TRUST = [
  { icon: ShieldCheck, label: "Viewing keys only" },
  { icon: FileCheck2, label: "Signed proof of income" },
  { icon: KeyRound, label: "Passkey sign-in" },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 size-[520px] animate-aurora rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute -right-32 top-10 size-[460px] animate-aurora rounded-full bg-paid-bg blur-3xl [animation-delay:-6s]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-paper to-transparent" />
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-4 pb-16 pt-12 sm:gap-14 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-24">
        <div className="max-w-[600px]">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-xs backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-paid-fg/60" />
                <span className="relative inline-flex size-2 rounded-full bg-paid-fg" />
              </span>
              Live on Zcash testnet · non-custodial
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 text-[36px] font-semibold leading-[1.06] tracking-[-0.035em] text-ink-strong sm:text-[58px] sm:leading-[1.02]">
              The private books for money you&apos;re paid in{" "}
              <span className="font-serif italic font-normal tracking-[-0.01em] text-brand-600">Zcash.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-[500px] text-base leading-6 text-ink-soft sm:text-lg sm:leading-7">
              Invoices that reconcile themselves, and proof of income you can share with your accountant or
              grant committee — without exposing anything else.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Link href="/onboarding">
                <Button size="xl" className="w-full sm:w-auto">
                  Try the live sandbox
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                </Button>
              </Link>
              <Link href="/i/demo">
                <Button size="xl" variant="secondary" className="w-full sm:w-auto">
                  See a live invoice
                </Button>
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 sm:mt-8">
              {TRUST.map((t) => (
                <li key={t.label} className="flex items-center gap-1.5 text-[13px] font-medium text-ink-soft">
                  <t.icon className="size-4 text-brand-600" strokeWidth={1.8} aria-hidden />
                  {t.label}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="relative flex justify-center lg:justify-end">
          <div id="live-demo" className="relative scroll-mt-24">
            <PayCardDemo />
            <div className="absolute -left-6 -top-12 hidden animate-float items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium text-ink shadow-md xl:flex">
              <BadgeCheck className="size-4 text-paid-fg" strokeWidth={2} aria-hidden />
              Signed receipt issued
            </div>
            <div className="absolute -bottom-12 right-4 hidden animate-float items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium text-ink shadow-md [animation-delay:-3s] xl:flex">
              <Layers className="size-4 text-brand-600" strokeWidth={2} aria-hidden />
              Confirmed in a real block
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
