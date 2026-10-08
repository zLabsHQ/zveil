import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Stat({
  label,
  children,
  sub,
  className,
}: {
  label: string;
  children: ReactNode;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4 shadow-xs", className)}>
      <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-muted">
        {label}
      </div>
      <div className="mt-1.5">{children}</div>
      {sub && <div className="mt-1 text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}
