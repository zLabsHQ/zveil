"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ZveilMark } from "@/components/ui/logo";
import { setVeiled, useVeiled } from "@/components/money/amount";
import {
  ArrowUpRight,
  ArrowLeftRight,
  Check,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  Plus,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FAUCET_URL, NETWORKS } from "@/lib/network";

type NavItem = { href: string; label: string; icon: typeof FileText; exact?: boolean; external?: boolean; badge?: number };

function navGroups(exceptions: number): { title: string; items: NavItem[] }[] {
  return [
    { title: "Overview", items: [{ href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
    {
      title: "Receivables",
      items: [
        { href: "/app/invoices", label: "Invoices", icon: FileText },
        { href: "/app/payments", label: "Payments", icon: ArrowLeftRight, badge: exceptions },
      ],
    },
    {
      title: "Reporting",
      items: [{ href: "/api/export", label: "Export ledger (CSV)", icon: Download, external: true }],
    },
    { title: "Workspace", items: [{ href: "/app/settings", label: "Settings", icon: Settings }] },
  ];
}

const TITLES: [RegExp, string][] = [
  [/^\/app\/invoices\/new/, "New invoice"],
  [/^\/app\/invoices\/.+/, "Invoice"],
  [/^\/app\/invoices/, "Invoices"],
  [/^\/app\/payments/, "Payments"],
  [/^\/app\/settings/, "Settings"],
  [/^\/app/, "Dashboard"],
];

function VeilToggle() {
  const on = useVeiled();
  return (
    <button
      type="button"
      onClick={() => setVeiled(!on)}
      title={on ? "Reveal amounts" : "Hide amounts"}
      aria-label={on ? "Reveal amounts" : "Hide amounts"}
      className="flex size-8 items-center justify-center rounded-md text-ink-muted transition hover:bg-surface-sunken hover:text-ink"
    >
      {on ? <EyeOff className="size-4" strokeWidth={1.8} /> : <Eye className="size-4" strokeWidth={1.8} />}
    </button>
  );
}

function NetworkSwitcher() {
  const [height, setHeight] = useState<number | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    const load = () =>
      fetch("/api/status")
        .then((r) => r.json())
        .then((s: { latestHeight: number | null; scanner: unknown }) => {
          setHeight(s.latestHeight);
          setOnline(Boolean(s.scanner));
        })
        .catch(() => setOnline(false));
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-surface pl-2.5 pr-2 text-xs font-medium text-ink-soft shadow-xs transition hover:border-border-strong hover:text-ink"
        aria-label="Network"
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            online === false ? "bg-pending-fg" : "animate-breathe bg-paid-fg",
          )}
        />
        Testnet
        {height && <span className="tabular text-ink-faint">#{height.toLocaleString()}</span>}
        <ChevronDown className="size-3.5 text-ink-faint" strokeWidth={2} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-72 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 pb-1.5 pt-1 text-[11px] uppercase tracking-[0.06em] text-ink-faint">
            Network
          </DropdownMenuLabel>
          {NETWORKS.map((n) => (
            <DropdownMenuItem
              key={n.id}
              disabled={!n.live}
              className="items-start gap-2.5 rounded-md px-2 py-2 data-disabled:opacity-100"
            >
              <span
                className={cn(
                  "mt-1 size-2 shrink-0 rounded-full",
                  n.live ? "bg-paid-fg" : "bg-border-strong",
                )}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={cn("text-[13px] font-medium", n.live ? "text-ink" : "text-ink-muted")}>
                  {n.label}
                </span>
                <span className="text-xs text-ink-muted">{n.note}</span>
              </span>
              {n.live ? (
                <Check className="mt-0.5 size-4 text-brand-600" strokeWidth={2.2} aria-label="Active" />
              ) : (
                <span className="mt-0.5 rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                  Coming soon
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem
          className="gap-2 rounded-md px-2 py-2 text-[13px] text-ink-soft"
          render={<a href={FAUCET_URL} target="_blank" rel="noreferrer" />}
        >
          Get free testnet ZEC
          <ArrowUpRight className="ml-auto size-3.5 text-ink-faint" aria-hidden />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const cls = cn(
    "group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
    active ? "bg-surface-sunken text-ink-strong" : "text-ink-soft hover:bg-surface-hover hover:text-ink",
  );
  const body = (
    <>
      <item.icon
        className={cn("size-4", active ? "text-ink-strong" : "text-ink-faint group-hover:text-ink-soft")}
        strokeWidth={1.8}
        aria-hidden
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="tabular rounded-full bg-pending-bg px-1.5 py-px text-[11px] font-semibold text-pending-fg">
          {item.badge}
        </span>
      ) : null}
    </>
  );
  return item.external ? (
    <a href={item.href} className={cls}>
      {body}
    </a>
  ) : (
    <Link href={item.href} className={cls} aria-current={active ? "page" : undefined}>
      {body}
    </Link>
  );
}

export function AppShell({
  children,
  workspaceName,
  exceptions,
}: {
  children: React.ReactNode;
  workspaceName: string;
  exceptions: number;
}) {
  const pathname = usePathname();
  const groups = navGroups(exceptions);
  const title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? "Dashboard";
  const isActive = (n: NavItem) =>
    !n.external && (n.exact ? pathname === n.href : pathname.startsWith(n.href));

  return (
    <div className="flex flex-1">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-border bg-surface max-lg:hidden">
        <Link
          href="/app/settings"
          className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-surface-hover"
        >
          <ZveilMark size={32} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-semibold text-ink-strong">{workspaceName}</span>
            <span className="text-[11px] text-ink-muted">Sandbox · Testnet</span>
          </span>
        </Link>

        <nav className="mt-4 flex flex-1 flex-col gap-5 overflow-y-auto px-3" aria-label="App">
          {groups.map((g) => (
            <div key={g.title} className="flex flex-col gap-0.5">
              <div className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-faint">
                {g.title}
              </div>
              {g.items.map((n) => (
                <NavLink key={n.href} item={n} active={isActive(n)} />
              ))}
            </div>
          ))}
        </nav>

        <div className="m-3 rounded-lg border border-border bg-paper p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <ShieldCheck className="size-3.5 text-paid-fg" strokeWidth={2} aria-hidden />
            View-only by design
          </div>
          <p className="mt-1 text-[11px] leading-4 text-ink-muted">
            Zveil holds viewing keys only. It can detect payments — never move funds.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-border bg-paper/85 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/app" className="lg:hidden" aria-label="Dashboard">
                <ZveilMark size={30} />
              </Link>
              <h2 className="truncate text-sm font-semibold text-ink-strong">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <VeilToggle />
              <NetworkSwitcher />
              <Link href="/app/invoices/new" className="max-sm:hidden">
                <Button size="sm" className="h-8 gap-1.5">
                  <Plus className="size-3.5" strokeWidth={2.2} aria-hidden />
                  New invoice
                </Button>
              </Link>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden" aria-label="App mobile">
            {groups.flatMap((g) => g.items).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                  isActive(n) ? "bg-ink-strong text-white" : "bg-surface-sunken text-ink-soft",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="border-b border-brand-100 bg-brand-50/70 px-4 py-2 text-center text-xs text-brand-800 sm:px-8">
          <span className="font-semibold">Testnet sandbox.</span> Payments are real shielded transactions on the
          Zcash testnet — test ZEC has no value.{" "}
          <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
            Get free testnet ZEC ↗
          </a>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
