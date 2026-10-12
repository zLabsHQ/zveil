import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface shadow-xs", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        {hint && <div className="mt-0.5 text-xs text-ink-muted">{hint}</div>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, children, sub }: { label: string; children: ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-xs">
      <div className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-muted">{label}</div>
      <div className="mt-1.5">{children}</div>
      {sub && <div className="mt-1 text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}
