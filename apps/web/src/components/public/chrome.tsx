import Link from "next/link";
import type { ReactNode } from "react";
import { ZveilMark, ZveilWordmark } from "@/components/ui/logo";

export function PublicHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="mx-auto flex w-full max-w-[760px] items-center justify-between px-4 py-5">
      <Link href="/" aria-label="Zveil home" className="transition-opacity hover:opacity-70">
        <ZveilWordmark />
      </Link>
      {right === null ? null : (
        right ?? (
          <nav className="flex items-center gap-4 text-xs font-medium text-ink-muted sm:gap-5 sm:text-[13px]">
            <Link
              href="/how"
              className="hidden transition-colors hover:text-ink-strong min-[420px]:inline"
            >
              How it works
            </Link>
            <Link href="/verify" className="transition-colors hover:text-ink-strong">
              Verify a proof
            </Link>
            <Link
              href="/onboarding"
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-ink-soft shadow-sm transition-colors hover:text-ink-strong"
            >
              Get started
            </Link>
          </nav>
        )
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-[760px] flex-col items-center justify-between gap-2.5 px-4 py-6 text-[11px] text-ink-faint sm:flex-row">
        <span className="inline-flex items-center gap-1.5">
          <ZveilMark size={14} aria-hidden />
          Powered by Zveil — private books for ZEC income
        </span>
        <nav className="flex items-center gap-4">
          <Link href="/how" className="transition-colors hover:text-ink-muted">
            How it works
          </Link>
          <Link href="/verify" className="transition-colors hover:text-ink-muted">
            Verify a proof
          </Link>
          <a
            href="https://github.com/zLabsHQ/zveil"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-ink-muted"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
