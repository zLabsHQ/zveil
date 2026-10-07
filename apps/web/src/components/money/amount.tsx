import { cn, formatZec, formatFiat } from "@/lib/utils";

interface AmountProps {
  zats: number;
  fiat?: number | null;
  size?: "sm" | "md" | "hero";
  className?: string;
  unit?: "ZEC" | "TAZ";
}

const sizes = {
  sm: { number: "text-[13px] leading-5", unit: "text-[11px]", fiat: "text-[11px]" },
  md: { number: "text-[22px] leading-7", unit: "text-[13px]", fiat: "text-xs" },
  hero: { number: "text-[44px] leading-12", unit: "text-lg", fiat: "text-sm" },
};

export function Amount({ zats, fiat, size = "md", className, unit = "ZEC" }: AmountProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="tabular font-semibold text-ink-strong whitespace-nowrap">
        <span className={s.number}>{formatZec(zats)}</span>{" "}
        <span className={cn(s.unit, "font-medium text-ink-muted align-baseline")}>{unit}</span>
      </div>
      {fiat != null && (
        <span className={cn(s.fiat, "tabular text-ink-muted")}>≈ {formatFiat(fiat)}</span>
      )}
    </div>
  );
}
