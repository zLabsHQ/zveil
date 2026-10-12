"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Status = {
  scanner?: { ok?: boolean; mode?: string; syncedHeight?: number } | null;
  latestHeight?: number | null;
  rateUsdPerZec?: number | null;
};

export function LiveStrip({ className }: { className?: string }) {
  const [s, setS] = useState<Status | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const load = () =>
      fetch("/api/status")
        .then((r) => r.json())
        .then((d: Status) => {
          setS(d);
          setFailed(false);
        })
        .catch(() => setFailed(true));
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, []);

  const live = !!s?.scanner?.ok && !failed;
  const height = s?.scanner?.syncedHeight ?? s?.latestHeight;

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-x-4 gap-y-1 rounded-full border border-border bg-surface px-4 py-2 text-xs shadow-xs",
        className,
      )}
    >
      <span className="flex items-center gap-2 font-medium text-ink">
        <span className={cn("size-1.5 rounded-full", live ? "animate-breathe bg-paid-fg" : "bg-pending-fg")} />
        {s === null && !failed ? "Connecting to scanner…" : live ? `Scanner live · ${s?.scanner?.mode ?? "chain"} mode` : "Scanner offline"}
      </span>
      {live && height ? (
        <span className="tabular text-ink-muted">
          Synced to block <span className="font-medium text-ink">#{height.toLocaleString()}</span>
        </span>
      ) : null}
      {live && s?.rateUsdPerZec ? (
        <span className="tabular text-ink-muted">
          1 ZEC ≈ <span className="font-medium text-ink">${s.rateUsdPerZec.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
        </span>
      ) : null}
    </div>
  );
}
