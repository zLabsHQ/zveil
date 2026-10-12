import { Reveal } from "./reveal";
import { CopyButton } from "@/components/zcash/address-field";
import {
  Eye,
  FileCheck2,
  Fingerprint,
  Landmark,
  Link2,
  Lock,
  QrCode,
  ScanLine,
  Sparkles,
} from "lucide-react";

/* ---------- Section shell ---------- */
function Section({
  id,
  eyebrow,
  title,
  sub,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-16 py-14 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <Reveal>
          <div className="max-w-[640px]">
            {eyebrow && (
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">
                {eyebrow}
              </div>
            )}
            <h2 className="mt-2 text-[26px] font-semibold leading-8 tracking-[-0.02em] text-ink-strong sm:text-[36px] sm:leading-10">
              {title}
            </h2>
            {sub && <p className="mt-4 text-base leading-6 text-ink-soft">{sub}</p>}
          </div>
        </Reveal>
        {children}
      </div>
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-surface p-5 shadow-xs sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

/* ---------- How it works ---------- */
export function Steps() {
  const steps = [
    {
      icon: Link2,
      title: "Send a link",
      body: "Create an invoice with line items and a due date. Zveil gives it a hosted page and a payment link.",
    },
    {
      icon: ScanLine,
      title: "They scan once",
      body: "Your client opens a QR or payment link in any Zcash wallet. The amount and address are pre-filled — nothing to type.",
    },
    {
      icon: Sparkles,
      title: "It reconciles itself",
      body: "Zveil detects the payment, marks the invoice paid, and writes the receipt. Your ledger stays clean.",
    },
  ];
  return (
    <Section
      id="how"
      eyebrow="How it works"
      title="Three steps to a paid invoice"
      sub="No copy-pasted addresses, no “did you send it?”, no matching payments by eye."
    >
      <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.06}>
            <Card className="h-full">
              <div className="flex size-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                <s.icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
              </div>
              <div className="mt-4 text-[15px] font-semibold text-ink">{s.title}</div>
              <p className="mt-1.5 text-sm leading-6 text-ink-soft">{s.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Differentiator: per-invoice address ---------- */
export function UniqueAddress() {
  return (
    <Section
      eyebrow="Private by construction"
      title="A unique shielded address for every invoice"
      sub="Each invoice generates its own diversified Zcash address. On-chain, your invoices are unlinkable — and matching never depends on the payer typing a memo."
    >
      <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <div className="mb-3 text-xs font-medium uppercase tracking-[0.06em] text-ink-faint">
              Invoice INV-0007 · Brand refresh
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-sunken px-3 py-2.5">
              <span className="truncate font-mono text-[13px] text-ink">
                u1q7x…k9w7
              </span>
              <CopyButton value="u1q7xzveil-demo-7k9w7" />
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
              <Fingerprint className="size-3" strokeWidth={1.8} aria-hidden />
              Unique address
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.06}>
          <Card className="h-full">
            <div className="mb-3 text-xs font-medium uppercase tracking-[0.06em] text-ink-faint">
              Invoice INV-0008 · Illustration set
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-sunken px-3 py-2.5">
              <span className="truncate font-mono text-[13px] text-ink">
                u1m4d…x2p9
              </span>
              <CopyButton value="u1m4dzveil-demo-8x2p9" />
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
              <Fingerprint className="size-3" strokeWidth={1.8} aria-hidden />
              Unique address — unlinkable to INV-0007
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

/* ---------- Privacy promise ---------- */
export function Privacy() {
  const items = [
    {
      icon: Lock,
      title: "Viewing keys only",
      body: "Zveil reads payments with a Unified Full Viewing Key. There is no spending key on our servers — we can see your income, never move it.",
    },
    {
      icon: Eye,
      title: "Share what you choose",
      body: "Give your accountant a link to one invoice — not your whole history. Links expire and can be revoked anytime.",
    },
    {
      icon: Landmark,
      title: "Clean books",
      body: "Every payment lands in a ledger with receipts and CSV export. Tax season stops being archaeology.",
    },
  ];
  return (
    <Section
      id="privacy"
      eyebrow="The privacy promise"
      title="Private for them. Provable for you."
      sub="Your payer's details stay encrypted to you. You still get the records a real business needs."
      className="bg-surface border-y border-border"
    >
      <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
        {items.map((it, i) => (
          <Reveal key={it.title} delay={i * 0.06}>
            <Card className="h-full bg-paper">
              <div className="flex size-9 items-center justify-center rounded-md bg-surface text-ink">
                <it.icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
              </div>
              <div className="mt-4 text-[15px] font-semibold text-ink">{it.title}</div>
              <p className="mt-1.5 text-sm leading-6 text-ink-soft">{it.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Built on standards ---------- */
export function Standards() {
  const rows = [
    {
      icon: QrCode,
      title: "ZIP-321 payment links",
      body: "Amounts, addresses and memos pre-fill in the payer's wallet. Nothing to mistype.",
    },
    {
      icon: Fingerprint,
      title: "ZIP-316 Unified Addresses",
      body: "Shielded-only diversified addresses per invoice, derived from one viewing key.",
    },
    {
      icon: FileCheck2,
      title: "Current shielded pools",
      body: "Detection covers Orchard and the newest Ironwood pool — where modern wallets actually send today.",
    },
    {
      icon: Lock,
      title: "Open source, view-only",
      body: "Non-custodial by design. Our scanner and ZIP-321 library are reusable open-source packages.",
    },
  ];
  return (
    <Section
      eyebrow="Built on Zcash standards"
      title="Correct where it counts"
    >
      <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {rows.map((r, i) => (
          <Reveal key={r.title} delay={i * 0.05}>
            <div className="h-full rounded-lg border border-border bg-surface p-5">
              <r.icon className="size-5 text-ink" strokeWidth={1.6} aria-hidden />
              <div className="mt-3 text-sm font-semibold text-ink">{r.title}</div>
              <p className="mt-1 text-[13px] leading-5 text-ink-soft">{r.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
