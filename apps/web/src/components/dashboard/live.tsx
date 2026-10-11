"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Activity, Eye, Layers, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Keeps server-rendered receivables fresh while the page is open. */
export function AutoRefresh({ everyMs = 20_000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, everyMs);
    return () => clearInterval(t);
  }, [router, everyMs]);
  return null;
}

type Status = {
  scanner: { latestHeight: number; syncedHeight: number; mode: string; accounts: number } | null;
  network: string;
};

export function ScannerHealth() {
  const [s, setS] = useState<Status | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  useEffect(() => {
    const load = () =>
      fetch("/api/status")
        .then((r) => r.json())
        .then((v: Status) => {
          setS(v);
          setCheckedAt(Date.now());
        })
        .catch(() => setS({ scanner: null, network: "testnet" }));
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  const online = Boolean(s?.scanner);
  const rows = [
    { icon: Layers, label: "Synced block", value: s?.scanner ? `#${s.scanner.syncedHeight.toLocaleString()}` : "—" },
    { icon: Radio, label: "Pools scanned", value: "Orchard · Ironwood" },
    { icon: Eye, label: "Key type", value: "Viewing key (no spend)" },
  ];

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-strong">
          <Activity className="size-3.5 text-ink-muted" strokeWidth={2} aria-hidden />
          Payment detection
        </h3>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            s == null ? "bg-surface-sunken text-ink-muted" : online ? "bg-paid-bg text-paid-fg" : "bg-pending-bg text-pending-fg",
          )}
        >
          <span className={cn("size-1.5 rounded-full", online ? "animate-breathe bg-paid-fg" : "bg-pending-fg")} />
          {s == null ? "Checking" : online ? "Live" : "Reconnecting"}
        </span>
      </div>
      <dl className="mt-4 flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2.5 text-[13px]">
            <r.icon className="size-3.5 text-ink-faint" strokeWidth={1.8} aria-hidden />
            <dt className="flex-1 text-ink-muted">{r.label}</dt>
            <dd className="tabular font-medium text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 border-t border-border pt-3 text-[11px] leading-4 text-ink-faint">
        Trial-decrypting every Zcash testnet block{checkedAt ? " · checked moments ago" : ""}.
      </p>
    </section>
  );
}

export function ClearSampleButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch("/api/sample", { method: "DELETE" });
          router.refresh();
        })
      }
    >
      {pending ? "Clearing…" : "Clear sample data"}
    </Button>
  );
}
