import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, CircleDot, FilePlus2, Send, type LucideIcon } from "lucide-react";
import { cn, invLabel } from "@/lib/utils";
import { zatsToZec } from "@z-labs/zip321";
import type { ActivityItem } from "@/lib/ledger";

const ZEC = 100_000_000;

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("flex flex-col rounded-xl border border-border bg-surface shadow-xs", className)}>
      <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div>
          <h3 className="text-[13px] font-semibold text-ink-strong">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
        </div>
        {action}
      </header>
      <div className={cn("flex-1 px-5 pb-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Kpi({
  label,
  children,
  hint,
  trend,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
  trend?: number | null;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        {trend != null && Number.isFinite(trend) && (
          <span
            className={cn(
              "tabular inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] font-semibold",
              trend >= 0 ? "bg-paid-bg text-paid-fg" : "bg-danger-bg text-danger-fg",
            )}
          >
            {trend >= 0 ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownLeft className="size-3" aria-hidden />}
            {Math.abs(Math.round(trend * 100))}%
          </span>
        )}
      </div>
      <div className="mt-2">{children}</div>
      {hint && <div className="mt-1.5 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

export const BigNumber = ({ children }: { children: ReactNode }) => (
  <div className="tabular text-[22px] font-semibold leading-7 tracking-[-0.01em] text-ink-strong">{children}</div>
);

/** Weekly received bars — plain HTML so it stays crisp at any width. */
export function ReceivedChart({ weeks }: { weeks: { start: number; zats: number }[] }) {
  const max = Math.max(...weeks.map((w) => w.zats), 1);
  const top = niceCeil(max / ZEC);
  const fmt = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="pt-3">
      <div className="relative h-44">
        {[1, 0.5, 0].map((f) => (
          <div key={f} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${f * 100}%` }}>
            <span className="tabular w-8 -translate-y-1/2 text-right text-[10px] text-ink-faint">
              {trimNum(top * f)}
            </span>
            <span className="h-px flex-1 -translate-y-1/2 border-t border-dashed border-border" />
          </div>
        ))}
        <div className="absolute inset-y-0 left-10 right-0 flex items-end gap-1.5">
          {weeks.map((w, i) => {
            const h = (w.zats / ZEC / top) * 100;
            const current = i === weeks.length - 1;
            return (
              <div key={w.start} className="group relative flex h-full flex-1 items-end">
                <div
                  className={cn(
                    "w-full rounded-t-[4px] transition-colors",
                    w.zats === 0 ? "bg-surface-sunken" : current ? "bg-brand-600" : "bg-brand-200 group-hover:bg-brand-400",
                  )}
                  style={{ height: `${Math.max(h, w.zats ? 2 : 1.5)}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-strong px-2 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  <span className="tabular font-semibold">{zatsToZec(w.zats)} ZEC</span>
                  <span className="text-white/60"> · wk of {fmt(w.start)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="ml-10 mt-2 flex justify-between text-[10px] text-ink-faint">
        <span>{fmt(weeks[0].start)}</span>
        <span>{fmt(weeks[Math.floor(weeks.length / 2)].start)}</span>
        <span>This week</span>
      </div>
    </div>
  );
}

const AGING_COLORS = ["bg-open-fg", "bg-pending-fg/60", "bg-pending-fg", "bg-danger"];

export function AgingBreakdown({ buckets }: { buckets: { label: string; zats: number; count: number }[] }) {
  const total = buckets.reduce((s, b) => s + b.zats, 0);
  const count = buckets.reduce((s, b) => s + b.count, 0);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="tabular text-[22px] font-semibold leading-7 text-ink-strong">
          {zatsToZec(total)} <span className="text-[13px] font-medium text-ink-muted">ZEC</span>
        </div>
        <div className="text-xs text-ink-muted">
          outstanding across {count} invoice{count === 1 ? "" : "s"}
        </div>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-surface-sunken">
        {total > 0 &&
          buckets.map((b, i) =>
            b.zats ? (
              <div key={b.label} className={AGING_COLORS[i]} style={{ width: `${(b.zats / total) * 100}%` }} />
            ) : null,
          )}
      </div>
      <ul className="flex flex-col gap-2.5">
        {buckets.map((b, i) => (
          <li key={b.label} className="flex items-center gap-2.5 text-[13px]">
            <span className={cn("size-2 rounded-full", AGING_COLORS[i])} />
            <span className="flex-1 text-ink-soft">{b.label}</span>
            <span className="text-xs text-ink-faint">{b.count}</span>
            <span className="tabular w-20 text-right font-medium text-ink">{zatsToZec(b.zats)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ACTIVITY: Record<ActivityItem["kind"], { icon: LucideIcon; tone: string; text: (a: ActivityItem) => string }> = {
  created: { icon: FilePlus2, tone: "bg-surface-sunken text-ink-muted", text: () => "Draft created" },
  sent: { icon: Send, tone: "bg-open-bg text-open-fg", text: () => "Invoice issued" },
  payment: {
    icon: ArrowDownLeft,
    tone: "bg-brand-50 text-brand-700",
    text: (a) => `Shielded payment · ${zatsToZec(a.zats ?? 0)} ZEC via ${a.pool}`,
  },
  paid: { icon: Check, tone: "bg-paid-bg text-paid-fg", text: () => "Paid in full" },
};

export function ActivityFeed({ items, now }: { items: ActivityItem[]; now: number }) {
  if (!items.length) return <p className="text-sm text-ink-muted">Activity appears here as invoices move.</p>;
  return (
    <ol className="relative flex flex-col gap-3.5">
      {items.map((a, k) => {
        const c = ACTIVITY[a.kind];
        return (
          <li key={`${a.invoice.id}-${a.kind}-${k}`} className="flex gap-3">
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", c.tone)}>
              <c.icon className="size-3.5" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/app/invoices/${a.invoice.id}`}
                className="block truncate text-[13px] font-medium text-ink hover:underline"
              >
                {c.text(a)}
              </Link>
              <div className="truncate text-xs text-ink-muted">
                <span className="font-mono">{invLabel(a.invoice)}</span> · {a.invoice.clientName} · {ago(a.at, now)}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export interface Step {
  title: string;
  body: string;
  done: boolean;
  href?: string;
  cta?: string;
  external?: boolean;
}

export function GetStarted({ steps }: { steps: Step[] }) {
  const done = steps.filter((s) => s.done).length;
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-ink-strong">Run a real testnet payment</h3>
          <p className="mt-0.5 text-xs text-ink-muted">
            Every step below happens on the live Zcash testnet — no simulations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="tabular text-xs font-medium text-ink-soft">
            {done} of {steps.length}
          </span>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
        </div>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s, i) => {
          const inner = (
            <>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  s.done ? "bg-paid-fg text-white" : "border border-border-strong text-ink-muted",
                )}
              >
                {s.done ? <Check className="size-3" strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-[13px] font-medium", s.done ? "text-ink-muted line-through decoration-ink-faint" : "text-ink")}>
                  {s.title}
                </span>
                <span className="mt-0.5 block text-xs leading-4 text-ink-muted">{s.body}</span>
                {!s.done && s.cta && <span className="mt-1.5 block text-xs font-semibold text-brand-600">{s.cta} →</span>}
              </span>
            </>
          );
          const cls = cn(
            "flex h-full gap-2.5 rounded-lg border p-3 text-left transition-colors",
            s.done ? "border-transparent bg-paper" : "border-border hover:border-brand-200 hover:bg-brand-50/40",
          );
          return (
            <li key={s.title}>
              {s.href && !s.done ? (
                s.external ? (
                  <a href={s.href} target="_blank" rel="noreferrer" className={cls}>
                    {inner}
                  </a>
                ) : (
                  <Link href={s.href} className={cls}>
                    {inner}
                  </Link>
                )
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function SampleTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.04em] text-ink-muted">
      <CircleDot className="size-2.5" aria-hidden />
      Sample
    </span>
  );
}

// ---------------------------------------------------------------- utils

function niceCeil(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

const trimNum = (v: number) => (v >= 10 ? v.toFixed(0) : v.toFixed(v % 1 ? 1 : 0));

export function ago(t: number, now: number) {
  const s = Math.max(0, (now - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86_400 * 30) return `${Math.floor(s / 86_400)}d ago`;
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
