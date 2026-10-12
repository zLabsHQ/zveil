import Link from "next/link";
import { LandingNav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Eye,
  FileCheck2,
  KeyRound,
  Layers,
  ScanLine,
  ShieldCheck,
  ShieldOff,
  UserX,
  Wallet,
} from "lucide-react";

export const metadata = {
  title: "How Zveil works",
  description:
    "Viewing keys in, signed proofs out — how Zveil detects shielded payments, reconciles invoices, and issues verifiable proof of income without ever holding funds.",
};

const FLOW = [
  {
    icon: Eye,
    step: "1",
    title: "A viewing key in",
    body: "You share a view-only unified full viewing key — or use the built-in testnet one to try things.",
    note: "ufvk / uivk · sees incoming payments, can never spend",
  },
  {
    icon: KeyRound,
    step: "2",
    title: "An address per invoice",
    body: "Every invoice gets its own diversified shielded address. Payers stay unlinkable, and every payment maps to exactly one invoice.",
    note: "ZIP-316 diversifiers · ZIP-321 payment URIs",
  },
  {
    icon: ScanLine,
    step: "3",
    title: "The scanner watches",
    body: "Our chain scanner trial-decrypts every block against your key. Payments surface in mempool, confirm by height, survive reorgs.",
    note: "mempool detect → block confirm · N confirmations",
  },
  {
    icon: FileCheck2,
    step: "4",
    title: "Signed proofs out",
    body: "Receipts and income statements carry a portable Ed25519-signed code anyone can check — no Zveil account needed.",
    note: "zv1.* codes · /verify + public key endpoint",
  },
];

const NEVER = [
  {
    icon: ShieldOff,
    title: "Spending keys",
    body: "Zveil only ever holds viewing keys. Moving funds is mathematically impossible from what we store.",
  },
  {
    icon: Wallet,
    title: "Your funds",
    body: "Payments settle directly into your shielded wallet. Zveil is never in the money path — we observe, we don't custody.",
  },
  {
    icon: UserX,
    title: "Your identity",
    body: "No email, no password, no account graph. Passkeys secure workspaces; a recovery code is your backup.",
  },
];

export default function HowPage() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border py-16 sm:py-20">
          <div className="mx-auto max-w-[720px] px-4 text-center sm:px-8">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">
              Architecture
            </div>
            <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-strong sm:text-[44px]">
              Private by default.{" "}
              <span className="font-serif italic font-normal text-brand-600">Provable</span> on demand.
            </h1>
            <p className="mx-auto mt-4 max-w-[520px] text-base leading-6 text-ink-soft">
              Zveil turns Zcash viewing keys into a receivables engine: invoices that detect their own
              payments, and proof of income you can share without exposing anything else.
            </p>
          </div>
        </section>

        {/* The flow */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
            <div className="grid gap-4 lg:grid-cols-4">
              {FLOW.map((f, i) => (
                <div key={f.step} className="relative">
                  <div className="h-full rounded-lg border border-border bg-surface p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <f.icon className="size-4.5" strokeWidth={1.8} aria-hidden />
                      </span>
                      <span className="font-mono text-xs text-ink-faint">0{f.step}</span>
                    </div>
                    <h3 className="mt-4 text-[15px] font-semibold text-ink-strong">{f.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-5 text-ink-soft">{f.body}</p>
                    <p className="mt-3 font-mono text-[10.5px] leading-4 text-ink-faint">{f.note}</p>
                  </div>
                  {i < FLOW.length - 1 && (
                    <ArrowRight
                      className="absolute -right-3.5 top-1/2 z-10 hidden size-4 -translate-y-1/2 text-ink-faint lg:block"
                      strokeWidth={2}
                      aria-hidden
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Chain context strip */}
            <div className="mt-6 flex flex-col items-start gap-3 rounded-lg border border-border bg-paper px-5 py-4 sm:flex-row sm:items-center">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <Layers className="size-4 text-brand-600" strokeWidth={1.8} aria-hidden />
                Live on Zcash testnet
              </span>
              <p className="text-[13px] leading-5 text-ink-muted">
                Detection runs in chain mode — every block is trial-decrypted against registered viewing
                keys. What you see in a workspace is real shielded testnet activity, not a simulation.
              </p>
            </div>
          </div>
        </section>

        {/* What we never hold */}
        <section className="border-y border-border bg-surface/50 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
            <div className="max-w-[560px]">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">
                Non-custodial by construction
              </div>
              <h2 className="mt-2 text-[28px] font-semibold leading-9 tracking-[-0.02em] text-ink-strong sm:text-[34px]">
                What Zveil never holds
              </h2>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {NEVER.map((n) => (
                <div key={n.title} className="rounded-lg border border-border bg-surface p-6 shadow-xs">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-danger-bg/60 text-danger-fg">
                    <n.icon className="size-4.5" strokeWidth={1.8} aria-hidden />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-ink-strong">{n.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-5 text-ink-soft">{n.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Honest status */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-[720px] px-4 sm:px-8">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">
              Read us honestly
            </div>
            <h2 className="mt-2 text-[28px] font-semibold leading-9 tracking-[-0.02em] text-ink-strong">
              What a proof proves — and what it doesn&apos;t
            </h2>
            <div className="mt-5 flex flex-col gap-4 text-[15px] leading-6 text-ink-soft">
              <p>
                A valid <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[13px]">zv1</code>{" "}
                signature means Zveil observed those shielded payments using the recipient&apos;s viewing
                key. It is a signed observation you can hand to an accountant — not a chain-level proof a
                court could verify independently.
              </p>
              <p>
                Today the product runs on the Zcash <span className="font-semibold text-ink">testnet</span>{" "}
                — test ZEC has no value, but detection, reconciliation and proofs are real. The architecture
                is mainnet-shaped; mainnet follows a security review. Sample rows in the sandbox are always
                labelled.
              </p>
              <p>
                On pricing, simply: free while we&apos;re on testnet. At mainnet, flat SaaS — we never take a
                cut of payments, because we&apos;re never in the money path.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="veil-bg border-t border-border py-16 sm:py-20">
          <div className="mx-auto max-w-[720px] px-4 text-center sm:px-8">
            <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-ink-strong">
              See it detect a real payment
            </h2>
            <p className="mx-auto mt-3 max-w-[440px] text-base leading-6 text-ink-soft">
              Open a sandbox, send an invoice, pay it with a testnet wallet — watch the timeline grow.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/onboarding">
                <Button size="lg">
                  Open a sandbox
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                </Button>
              </Link>
              <Link href="/verify">
                <Button size="lg" variant="secondary">
                  <ShieldCheck className="size-4" strokeWidth={1.8} aria-hidden />
                  Verify a proof
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
