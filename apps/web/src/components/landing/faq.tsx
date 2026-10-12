import { ChevronDown } from "lucide-react";
import { Reveal } from "./reveal";

const FAQS = [
  {
    q: "Can Zveil spend or move my funds?",
    a: "No. Zveil only ever holds a view-only key, which can see incoming payments but cannot sign a transaction. Payments settle straight into your own shielded wallet — we are never in the money path.",
  },
  {
    q: "What does a signed proof actually prove?",
    a: "A valid proof means Zveil observed those shielded payments using the recipient's viewing key, and the details have not been altered since. It is a signed observation you can hand to an accountant or grant committee — not a chain-level proof a third party could verify without trusting Zveil.",
  },
  {
    q: "Is this on mainnet?",
    a: "Not yet. Zveil runs on the Zcash testnet today — detection, reconciliation and proofs are real, but the test ZEC has no value. Mainnet follows a security review.",
  },
  {
    q: "How do I sign in without an email or password?",
    a: "With a passkey (Face ID, Touch ID, Windows Hello, or a synced manager like iCloud Keychain or 1Password). You also get a one-time recovery code. We never ask for an email.",
  },
  {
    q: "How will Zveil make money?",
    a: "Flat software pricing — never a cut of your payments. Individuals stay free; teams and accountants pay for seats, API access and recurring statements. We charge for the software, not for your income.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 border-t border-border bg-surface py-14 sm:py-24">
      <div className="mx-auto grid max-w-[1200px] gap-7 px-4 sm:gap-10 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <div className="max-w-[360px]">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">FAQ</div>
            <h2 className="mt-2 text-[26px] font-semibold leading-8 tracking-[-0.02em] text-ink-strong sm:text-[36px] sm:leading-10">
              Questions we&apos;d ask too
            </h2>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="divide-y divide-border rounded-xl border border-border bg-paper">
            {FAQS.map((f) => (
              <details key={f.q} className="group px-4 py-3.5 sm:px-5 sm:py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink-strong">
                  {f.q}
                  <ChevronDown className="size-4 shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-180" strokeWidth={2} aria-hidden />
                </summary>
                <p className="mt-2.5 pr-8 text-sm leading-6 text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
