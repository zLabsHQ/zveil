import { cn } from "@/lib/utils";
import {
  CircleDashed,
  Circle,
  Clock3,
  CircleDot,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
  Ban,
  type LucideIcon,
} from "lucide-react";

export type InvoiceStatus =
  | "draft"
  | "open"
  | "seen"
  | "partial"
  | "paid"
  | "overpaid"
  | "overdue"
  | "void";

const config: Record<
  InvoiceStatus,
  { label: string; icon: LucideIcon | null; fg: string; bg: string; pulse?: boolean }
> = {
  draft: { label: "Draft", icon: CircleDashed, fg: "text-ink-soft", bg: "bg-surface-sunken" },
  open: { label: "Open", icon: Circle, fg: "text-open-fg", bg: "bg-open-bg" },
  seen: { label: "Payment seen", icon: null, fg: "text-pending-fg", bg: "bg-pending-bg", pulse: true },
  partial: { label: "Partially paid", icon: CircleDot, fg: "text-pending-fg", bg: "bg-pending-bg" },
  paid: { label: "Paid", icon: CheckCircle2, fg: "text-paid-fg", bg: "bg-paid-bg" },
  overpaid: { label: "Overpaid", icon: PlusCircle, fg: "text-over-fg", bg: "bg-over-bg" },
  overdue: { label: "Overdue", icon: AlertCircle, fg: "text-danger-fg", bg: "bg-danger-bg" },
  void: { label: "Void", icon: Ban, fg: "text-ink-muted", bg: "bg-surface-sunken" },
};

export function StatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  const c = config[status];
  const Icon = c.icon ?? Clock3;
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-xs font-medium",
        c.fg,
        c.bg,
        className,
      )}
    >
      {c.pulse ? (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-2 rounded-full bg-pending-fg opacity-75 animate-pulse-dot" />
          <span className="relative inline-flex size-2 rounded-full bg-pending-fg" />
        </span>
      ) : (
        <Icon className="size-3" strokeWidth={2.5} aria-hidden />
      )}
      {c.label}
    </span>
  );
}
