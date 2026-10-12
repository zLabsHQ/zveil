import { Check, CircleDashed } from "lucide-react";
import { Reveal } from "./reveal";

const TODAY = [
  "Invoices with a unique shielded address and ZIP-321 link each",
  "Live payment detection by viewing key — mempool and confirmations",
  "Partial, over and late payment reconciliation",
  "Signed receipts and period income statements, with public verification",
  "Scoped, expiring, revocable disclosure links and CSV export",
  "Passkey sign-in with one-time recovery codes",
];

const NEXT = [
  "Mainnet, after a security review",
  "API and webhooks, so other apps can build on Zveil",
  "Recurring invoices and team seats",
  "Team treasury with FROST multisig approvals",
  "ZIP 311 payment disclosures once the spec matures",
  "Cross-asset and stablecoin settlement into ZEC",
];

function Column({ title, tone, items, done }: { title: string; tone: string; items: string[]; done?: boolean }) {
  return (
    <div className="h-full rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
      <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${tone}`}>
        {title}
      </div>
      <ul className="mt-5 flex flex-col gap-3">
        {items.map((t) => (
          <li key={t} className="flex gap-2.5 text-sm leading-5 text-ink-soft">
            {done ? (
              <Check className="mt-0.5 size-4 shrink-0 text-paid-fg" strokeWidth={2.2} aria-hidden />
            ) : (
              <CircleDashed className="mt-0.5 size-4 shrink-0 text-ink-faint" strokeWidth={1.8} aria-hidden />
            )}
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Roadmap() {
  return (
    <section className="py-14 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <Reveal>
          <div className="max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">Straight talk</div>
            <h2 className="mt-2 text-[26px] font-semibold leading-8 tracking-[-0.02em] text-ink-strong sm:text-[36px] sm:leading-10">
              What works today, and what&apos;s next
            </h2>
            <p className="mt-4 text-base leading-6 text-ink-soft">
              Everything on the left runs on the Zcash testnet right now. We&apos;d rather show you the line
              than blur it.
            </p>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-2">
          <Reveal>
            <Column title="Working today" tone="bg-paid-bg text-paid-fg" items={TODAY} done />
          </Reveal>
          <Reveal delay={0.07}>
            <Column title="On the roadmap" tone="bg-surface-sunken text-ink-muted" items={NEXT} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
