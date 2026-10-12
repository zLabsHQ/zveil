"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { setVeiled, useVeiled } from "@/components/money/amount";
import { FAUCET_URL } from "@/lib/network";
import { zatsToZec } from "@z-labs/zip321";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Download,
  EyeOff,
  FileText,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type Item = {
  id: string;
  group: string;
  title: string;
  sub?: string;
  icon: LucideIcon;
  kbd?: string;
  run: () => void;
};

type ApiInvoice = {
  id: string;
  seq: number | null;
  clientName: string;
  amountZats: number;
  status: string;
};

function match(q: string, ...parts: (string | undefined)[]) {
  return parts.join(" ").toLowerCase().includes(q.toLowerCase());
}

export function CommandPalette() {
  const router = useRouter();
  const veiled = useVeiled();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [invs, setInvs] = useState<ApiInvoice[] | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const openPalette = useCallback(() => {
    setQ("");
    setIdx(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) close();
        else openPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openPalette, close]);

  useEffect(() => {
    if (!open || invs !== null) return;
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((d) => setInvs(d.invoices ?? []))
      .catch(() => setInvs([]));
  }, [open, invs]);

  const go = useCallback(
    (href: string) => () => {
      close();
      router.push(href);
    },
    [close, router],
  );
  const external = useCallback(
    (href: string) => () => {
      close();
      window.open(href, "_blank", "noopener,noreferrer");
    },
    [close],
  );

  const items = useMemo<Item[]>(() => {
    const base: Item[] = [
      { id: "new", group: "Actions", title: "New invoice", icon: Plus, run: go("/app/invoices/new") },
      { id: "export", group: "Actions", title: "Export ledger (CSV)", icon: Download, run: go("/api/export") },
      { id: "verify", group: "Actions", title: "Verify a proof code", icon: ShieldCheck, run: go("/verify") },
      { id: "veil", group: "Actions", title: veiled ? "Reveal amounts" : "Hide amounts", icon: EyeOff, run: () => { close(); setVeiled(!veiled); } },
      { id: "faucet", group: "Actions", title: "Get testnet ZEC", sub: "faucet", icon: ArrowUpRight, run: external(FAUCET_URL) },
      { id: "dash", group: "Go to", title: "Dashboard", icon: LayoutDashboard, run: go("/app") },
      { id: "invs", group: "Go to", title: "Invoices", icon: FileText, run: go("/app/invoices") },
      { id: "pays", group: "Go to", title: "Payments", icon: ArrowLeftRight, run: go("/app/payments") },
      { id: "settings", group: "Go to", title: "Settings", icon: Settings, run: go("/app/settings") },
    ];
    const invItems: Item[] = (invs ?? []).map((i) => ({
      id: `inv-${i.id}`,
      group: "Invoices",
      title: i.seq ? `INV-${String(i.seq).padStart(4, "0")}` : "Draft invoice",
      sub: `${i.clientName} · ${zatsToZec(i.amountZats)} ZEC · ${i.status}`,
      icon: FileText,
      run: go(`/app/invoices/${i.id}`),
    }));
    return [...base, ...invItems];
  }, [invs, go, external, veiled, close]);

  const visible = useMemo(() => {
    const f = items.filter((i) => match(q, i.title, i.sub, i.group));
    return f.slice(0, 12);
  }, [items, q]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${idx}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => (i + 1) % Math.max(visible.length, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => (i - 1 + visible.length) % Math.max(visible.length, 1)); }
    else if (e.key === "Enter" && visible[idx]) { e.preventDefault(); visible[idx].run(); }
    else if (e.key === "Escape") close();
  };

  if (!open) return null;

  let lastGroup = "";
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/10 pt-[16vh] supports-backdrop-filter:backdrop-blur-xs"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        className="w-[min(92vw,560px)] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-ink-faint" strokeWidth={2} aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={onKey}
            placeholder="Search actions, pages, invoices…"
            className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint focus-visible:shadow-none"
          />
          <kbd className="shrink-0 rounded border border-border bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[320px] overflow-y-auto p-1.5">
          {visible.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-ink-muted">Nothing matches “{q}”.</div>
          )}
          {visible.map((item, i) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {showGroup && (
                  <div className="px-2.5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint first:pt-1">
                    {item.group}
                  </div>
                )}
                <button
                  type="button"
                  data-idx={i}
                  onMouseEnter={() => setIdx(i)}
                  onClick={item.run}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px]",
                    i === idx ? "bg-surface-sunken text-ink-strong" : "text-ink-soft",
                  )}
                >
                  <item.icon className="size-4 shrink-0 text-ink-faint" strokeWidth={1.8} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.title}</span>
                    {item.sub && <span className="block truncate text-[11px] text-ink-muted">{item.sub}</span>}
                  </span>
                  {i === idx && <kbd className="text-[10px] text-ink-faint">↵</kbd>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[10px] text-ink-faint">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span className="ml-auto">Zveil command palette</span>
        </div>
      </div>
    </div>
  );
}
