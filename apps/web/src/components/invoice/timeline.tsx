import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ago } from "@/components/dashboard/widgets";
import { cn } from "@/lib/utils";
import {
  Check,
  FileText,
  Layers,
  Link2,
  Radio,
  RotateCcw,
  Send,
  Timer,
  type LucideIcon,
} from "lucide-react";

export type TimelineEvent = {
  at: number | null; // null = pending, not yet happened
  kind: "created" | "issued" | "detected" | "mined" | "reorged" | "paid" | "reconciled" | "shared" | "awaiting";
  title: string;
  detail?: string;
};

const ICONS: Record<TimelineEvent["kind"], LucideIcon> = {
  created: FileText,
  issued: Send,
  detected: Radio,
  mined: Layers,
  reorged: RotateCcw,
  paid: Check,
  reconciled: Check,
  shared: Link2,
  awaiting: Timer,
};

const DOT: Record<TimelineEvent["kind"], string> = {
  created: "bg-surface-sunken text-ink-muted",
  issued: "bg-brand-50 text-brand-600",
  detected: "bg-pending-bg text-pending-fg",
  mined: "bg-brand-50 text-brand-600",
  reorged: "bg-danger-bg text-danger-fg",
  paid: "bg-paid-bg text-paid-fg",
  reconciled: "bg-paid-bg text-paid-fg",
  shared: "bg-brand-50 text-brand-600",
  awaiting: "bg-surface-sunken text-ink-faint",
};

export function Timeline({ events, now }: { events: TimelineEvent[]; now: number }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b border-border py-3.5">
        <CardTitle className="text-sm font-semibold">Timeline</CardTitle>
        <CardDescription>Observed end-to-end through the viewing key — we never hold funds</CardDescription>
      </CardHeader>
      <div className="px-5 py-4">
        {events.map((e, i) => {
          const Icon = ICONS[e.kind];
          const pending = e.at === null;
          return (
            <div key={i} className="relative flex gap-3 pb-5 last:pb-0">
              {i < events.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[11px] top-6 bottom-0 w-px",
                    pending ? "bg-transparent" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full",
                  DOT[e.kind],
                  pending && "animate-breathe",
                )}
              >
                <Icon className="size-3.5" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className={cn("text-[13px] font-medium", pending ? "text-ink-muted" : "text-ink")}>
                  {e.title}
                </div>
                {e.detail && (
                  <div className="mt-0.5 truncate font-mono text-[11px] text-ink-muted">{e.detail}</div>
                )}
              </div>
              <span className="shrink-0 pt-1 text-[11px] tabular text-ink-faint">
                {e.at ? ago(e.at, now) : ""}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
