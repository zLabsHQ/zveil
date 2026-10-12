import { Reveal } from "./reveal";
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "For getting started with private invoicing.",
    features: ["Up to 10 invoices / month", "Hosted invoice pages", "Payment detection & receipts", "CSV export"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$14",
    cadence: "per month",
    blurb: "For freelancers and creators who invoice often.",
    features: [
      "Unlimited invoices",
      "Fiat-denominated invoices",
      "Accountant share links",
      "Custom branding & domain",
      "Pay in ZEC or card",
    ],
    cta: "Start Pro",
    featured: true,
  },
  {
    name: "Team",
    price: "Soon",
    cadence: "post-launch",
    blurb: "For studios and DAOs with shared treasury.",
    features: [
      "Everything in Pro",
      "Team seats & roles",
      "FROST multisig vault",
      "Contractor payouts & payroll",
    ],
    cta: "Join waitlist",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 border-y border-border bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <Reveal>
          <div className="max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">
              Pricing
            </div>
            <h2 className="mt-2 text-[30px] font-semibold leading-9 tracking-[-0.02em] text-ink-strong sm:text-[36px] sm:leading-10">
              Flat pricing. Your money stays yours.
            </h2>
            <p className="mt-4 text-base leading-6 text-ink-soft">
              We never take a cut of your ZEC. Plain invoicing is flat-fee — value-added rails are
              priced separately when they ship.
            </p>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-xl border bg-surface p-6",
                  t.featured ? "border-ink-strong shadow-md" : "border-border shadow-xs",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-ink">{t.name}</div>
                  {t.featured && (
                    <span className="rounded-full bg-ink-strong px-2.5 py-1 text-[11px] font-medium text-white">
                      Most popular
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="tabular text-[36px] font-semibold leading-10 tracking-[-0.02em] text-ink-strong">
                    {t.price}
                  </span>
                  <span className="text-sm text-ink-muted">{t.cadence}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{t.blurb}</p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
                      <Check className="mt-0.5 size-4 shrink-0 text-paid-fg" strokeWidth={2.2} aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex-1" />
                <Link href="/onboarding" className="w-full">
                  <Button
                    variant={t.featured ? "primary" : "secondary"}
                    size="lg"
                    className="w-full"
                  >
                    {t.cta}
                  </Button>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
