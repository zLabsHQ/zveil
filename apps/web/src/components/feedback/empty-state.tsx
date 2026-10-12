import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-14 text-center", className)}>
      <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface-sunken">
        <Icon className="size-5 text-ink-faint" strokeWidth={1.5} aria-hidden />
      </div>
      <div>
        <div className="text-[15px] font-semibold text-ink">{title}</div>
        <p className="mx-auto mt-1 max-w-[340px] text-sm leading-6 text-ink-soft">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function Banner({
  tone,
  title,
  children,
  className,
}: {
  tone: "ok" | "warn" | "info" | "danger";
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    ok: "border-paid-fg/25 bg-paid-bg text-paid-fg",
    warn: "border-pending-fg/25 bg-pending-bg text-pending-fg",
    info: "border-brand-200 bg-brand-50 text-brand-700",
    danger: "border-danger-fg/25 bg-danger-bg text-danger-fg",
  };
  return (
    <div className={cn("rounded-md border px-4 py-3", tones[tone], className)}>
      <div className="text-sm font-semibold">{title}</div>
      {children && <div className="mt-0.5 text-[13px] leading-5 opacity-90">{children}</div>}
    </div>
  );
}
