import { PayCardDemo } from "./pay-card";
import { Reveal } from "./reveal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function Hero() {
  return (
    <section className="veil-bg">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-4 pb-20 pt-16 sm:px-8 lg:grid-cols-2 lg:gap-8 lg:pb-24 lg:pt-24">
        <div className="max-w-[560px]">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft shadow-xs">
              <ShieldCheck className="size-3.5 text-brand-600" strokeWidth={1.8} aria-hidden />
              Built for shielded ZEC · Ironwood-native
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 text-[44px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink-strong sm:text-[60px] sm:leading-[1.02]">
              Get paid in Zcash,{" "}
              <span className="font-serif italic font-normal tracking-[-0.01em] text-brand-600">
                privately.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-[440px] text-base leading-6 text-ink-soft sm:text-lg sm:leading-7">
              Beautiful invoices for people and teams paid in ZEC. Your client scans once, pays from
              any shielded wallet, and the invoice reconciles itself.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/onboarding">
                <Button size="xl" className="w-full sm:w-auto">
                  Create your first invoice
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                </Button>
              </Link>
              <a href="#live-demo">
                <Button size="xl" variant="secondary" className="w-full sm:w-auto">
                  See a live invoice
                </Button>
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 text-xs leading-5 text-ink-muted">
              Non-custodial. Zveil only sees a viewing key — it can never move your funds.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="flex justify-center lg:justify-end">
          <div id="live-demo" className="scroll-mt-24">
            <PayCardDemo />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
