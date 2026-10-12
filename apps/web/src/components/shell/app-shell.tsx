"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ZveilMark } from "@/components/ui/logo";
import { setVeiled, useVeiled } from "@/components/money/amount";
import {
  ArrowUpRight,
  ArrowLeftRight,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CommandPalette } from "@/components/shell/command-palette";

type NavItem = { href: string; label: string; icon: typeof FileText; exact?: boolean; external?: boolean; newTab?: boolean; badge?: number };

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
    {
      title: "Resources",
      items: [
        { href: "/how", label: "How it works", icon: BookOpen },
        { href: "/verify", label: "Verify a proof", icon: ShieldCheck },
        { href: FAUCET_URL, label: "Get testnet ZEC", icon: ArrowUpRight, external: true, newTab: true },
      ],
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

type ScannerStatus = {
  ok?: boolean;
  mode?: string;
  latestHeight?: number;
  syncedHeight?: number;
  accounts?: number;
} | null;

function NetworkSwitcher() {
  const [height, setHeight] = useState<number | null>(null);
  const [scanner, setScanner] = useState<ScannerStatus>(null);
  useEffect(() => {
    const load = () =>
      fetch("/api/status")
        .then((r) => r.json())
        .then((s: { latestHeight: number | null; scanner: ScannerStatus }) => {
          setHeight(s.latestHeight);
          setScanner(s.scanner);
        })
        .catch(() => setScanner(null));
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
            scanner?.ok === false ? "bg-pending-fg" : "animate-breathe bg-paid-fg",
          )}
        />
        Testnet
        {height && <span className="tabular text-ink-faint">#{height.toLocaleString()}</span>}
        <ChevronDown className="size-3.5 text-ink-faint" strokeWidth={2} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-72 p-1.5">
        <div className="mx-1 mb-1.5 rounded-md bg-surface-sunken px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
            <ShieldCheck className="size-3.5 text-paid-fg" strokeWidth={2} aria-hidden />
            Detection engine
          </div>
          <div className="mt-1.5 flex flex-col gap-1 text-[12px]">
            <div className="flex justify-between">
              <span className="text-ink-muted">Scanner</span>
              <span className={cn("font-medium", scanner?.ok ? "text-paid-fg" : "text-pending-fg")}>
                {scanner === null ? "…" : scanner.ok ? `Live · ${scanner.mode ?? "chain"} mode` : "Unreachable"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Synced to block</span>
              <span className="tabular font-medium text-ink">
                {scanner?.syncedHeight ? `#${scanner.syncedHeight.toLocaleString()}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Viewing keys watched</span>
              <span className="tabular font-medium text-ink">{scanner?.accounts ?? "—"}</span>
            </div>
          </div>
        </div>
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
    <a href={item.href} className={cls} {...(item.newTab ? { target: "_blank", rel: "noreferrer" } : {})}>
      {body}
    </a>
  ) : (
    <Link href={item.href} className={cls} aria-current={active ? "page" : undefined}>
      {body}
    </Link>
  );
}

type SecurityState = { passkeys: unknown[]; recoveryAvailable: boolean } | null;

function WorkspaceMenu({ name }: { name: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [sec, setSec] = useState<SecurityState>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/passkeys")
      .then((r) => r.json())
      .then(setSec)
      .catch(() => setSec({ passkeys: [], recoveryAvailable: false }));
  }, []);

  const openConfirm = () => setConfirm(true);

  const signOut = async () => {
    setLeaving(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  };

  const secured = sec !== null && (sec.passkeys.length > 0 || sec.recoveryAvailable);
  const loaded = sec !== null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-surface-hover"
          aria-label="Workspace menu"
        >
          <ZveilMark size={32} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-semibold text-ink-strong">{name}</span>
            <span className="flex items-center gap-1 text-[11px] text-ink-muted">
              Sandbox · Testnet
              {secured && <Lock className="size-3 text-paid-fg" strokeWidth={2.2} aria-label="Secured by passkey" />}
            </span>
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-ink-faint" strokeWidth={2} aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6} className="w-56 p-1.5">
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="gap-2 rounded-md px-2 py-2 text-[13px] text-ink-soft"
              render={<Link href="/app/settings" />}
            >
              <Settings className="size-4 text-ink-faint" strokeWidth={1.8} aria-hidden />
              Workspace settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuItem
              className="gap-2 rounded-md px-2 py-2 text-[13px] text-ink-soft"
              onClick={openConfirm}
            >
              <LogOut className="size-4 text-ink-faint" strokeWidth={1.8} aria-hidden />
              Sign out of this browser
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Sign out of this browser?</DialogTitle>
            <DialogDescription>
              Your workspace stays exactly as it is — signing out only detaches this browser.
            </DialogDescription>
          </DialogHeader>
          {loaded && secured && (
            <div className="flex items-start gap-2.5 rounded-lg bg-paid-bg/60 px-3.5 py-3 text-[13px] text-ink-soft">
              <KeyRound className="mt-0.5 size-4 shrink-0 text-paid-fg" strokeWidth={1.8} aria-hidden />
              <span>You can get back in anytime with your passkey or recovery code.</span>
            </div>
          )}
          {loaded && !secured && (
            <div className="flex items-start gap-2.5 rounded-lg bg-pending-bg px-3.5 py-3 text-[13px] text-ink-soft">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-pending-fg" strokeWidth={1.8} aria-hidden />
              <span>
                <span className="font-semibold text-ink">This workspace isn&apos;t secured.</span> With no passkey
                or recovery code, signing out is permanent — there&apos;s no way back in.
              </span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-end gap-2">
            {!secured && loaded && (
              <Button size="sm" variant="secondary" render={<Link href="/app/settings" />}>
                <KeyRound className="size-3.5" strokeWidth={2} aria-hidden />
                Set up a passkey first
              </Button>
            )}
            <Button
              size="sm"
              variant={secured ? "default" : "ghost"}
              disabled={!loaded || leaving}
              onClick={signOut}
            >
              {leaving ? "Signing out…" : secured ? "Sign out" : "Sign out anyway"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
        <WorkspaceMenu name={workspaceName} />

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
              <button
                type="button"
                onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
                title="Command palette"
                className="hidden h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[11px] font-medium text-ink-muted shadow-xs transition hover:border-border-strong hover:text-ink sm:inline-flex"
              >
                <Search className="size-3.5" strokeWidth={2} aria-hidden />
                <kbd className="font-sans">⌘K</kbd>
              </button>
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
        <CommandPalette />
      </div>
    </div>
  );
}
