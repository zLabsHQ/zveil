"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ZveilWordmark } from "@/components/ui/logo";
import { FileText, LayoutDashboard, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/invoices", label: "Invoices", icon: FileText, exact: false },
  { href: "/app/settings", label: "Settings", icon: Settings, exact: false },
];

function NetworkPill() {
  const [s, setS] = useState<{ network: string; latestHeight: number | null; demoMode: boolean } | null>(null);
  useEffect(() => {
    const load = () => fetch("/api/status").then((r) => r.json()).then(setS).catch(() => null);
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft">
      <span className="size-1.5 animate-breathe rounded-full bg-paid-fg" />
      {s.network === "regtest" ? "Zcash · Regtest" : s.network === "testnet" ? "Zcash · Testnet" : "Zcash · Mainnet"}
      {s.latestHeight && (
        <span className="tabular text-ink-muted">· #{s.latestHeight.toLocaleString()}</span>
      )}
      {s.demoMode && <span className="text-brand-600">· demo</span>}
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-full">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-border bg-surface max-lg:hidden">
        <div className="px-4 py-4">
          <Link href="/">
            <ZveilWordmark />
          </Link>
        </div>
        <nav className="flex flex-col gap-0.5 px-2" aria-label="App">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface-sunken text-ink"
                    : "text-ink-soft hover:bg-surface-hover hover:text-ink",
                )}
              >
                <n.icon className="size-4" strokeWidth={1.8} aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-border px-4 py-3">
          <p className="text-xs leading-5 text-ink-muted">
            View-only mode — Zveil can never move funds.
          </p>
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col lg:pl-[240px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-paper/80 px-4 backdrop-blur-md sm:px-8">
          <div className="lg:hidden">
            <Link href="/app">
              <ZveilWordmark />
            </Link>
          </div>
          <div className="max-lg:hidden" />
          <div className="flex items-center gap-3">
            <NetworkPill />
            <Link href="/app/invoices/new">
              <Button size="sm" className="gap-1.5">
                <Plus className="size-3.5" strokeWidth={2.2} aria-hidden />
                New invoice
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto w-full max-w-[1040px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
