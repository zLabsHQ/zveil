import Link from "next/link";
import { Reveal } from "./reveal";
import { Button } from "@/components/ui/button";
import { ZveilWordmark } from "@/components/ui/logo";
import { ArrowRight } from "lucide-react";

export function ClosingCta() {
  return (
    <section className="veil-bg py-16 sm:py-24">
      <div className="mx-auto max-w-[720px] px-4 text-center sm:px-8">
        <Reveal>
          <h2 className="text-[28px] font-semibold leading-9 tracking-[-0.02em] text-ink-strong sm:text-[44px] sm:leading-[1.1]">
            Keep your books{" "}
            <span className="font-serif italic font-normal text-brand-600">private.</span> Prove them when it counts.
          </h2>
          <p className="mx-auto mt-4 max-w-[460px] text-base leading-6 text-ink-soft">
            Open a live testnet sandbox, send an invoice, pay it from a real wallet, and share a signed
            statement. No email, no password.
          </p>
          <div className="mt-7 sm:mt-8">
            <Link href="/onboarding">
              <Button size="xl">
                Try the live sandbox
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-10">
        <div>
          <ZveilWordmark />
          <p className="mt-2 max-w-[300px] text-sm leading-5 text-ink-muted">
            Private books and proof of income for people and teams paid in Zcash. Non-custodial. Open source.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-soft" aria-label="Footer">
          <Link href="/how" className="transition-colors hover:text-ink">How it works</Link>
          <Link href="/#privacy" className="transition-colors hover:text-ink">Privacy</Link>
          <Link href="/#faq" className="transition-colors hover:text-ink">FAQ</Link>
          <Link href="/verify" className="transition-colors hover:text-ink">Verify a proof</Link>
          <Link href="/app" className="transition-colors hover:text-ink">Open the app</Link>
          <a href="https://github.com/zLabsHQ/zveil" className="transition-colors hover:text-ink" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 text-xs text-ink-faint sm:px-8">
          <span>© 2026 Zveil</span>
          <span>Private payments powered by Zcash shielded addresses</span>
        </div>
      </div>
    </footer>
  );
}
