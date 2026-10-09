"use client";

import { useSyncExternalStore } from "react";
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

// "Veil" privacy mode — blurs amounts on shared screens (localStorage + event).
const VEIL_KEY = "zveil:veil";

function subscribeVeil(cb: () => void) {
  window.addEventListener(VEIL_KEY, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(VEIL_KEY, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useVeiled() {
  return useSyncExternalStore(
    subscribeVeil,
    () => localStorage.getItem(VEIL_KEY) === "1",
    () => false,
  );
}

export function setVeiled(veiled: boolean) {
  localStorage.setItem(VEIL_KEY, veiled ? "1" : "0");
  window.dispatchEvent(new Event(VEIL_KEY));
}

export function Amount({ zats, fiat, size = "md", className, unit = "ZEC" }: AmountProps) {
  const s = sizes[size];
  const veiled = useVeiled();
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="tabular font-semibold text-ink-strong whitespace-nowrap">
        {veiled ? (
          <span className={cn(s.number, "tracking-wide text-ink-muted")}>••••</span>
        ) : (
          <>
            <span className={s.number}>{formatZec(zats)}</span>{" "}
            <span className={cn(s.unit, "font-medium text-ink-muted align-baseline")}>{unit}</span>
          </>
        )}
      </div>
      {fiat != null && !veiled && (
        <span className={cn(s.fiat, "tabular text-ink-muted")}>≈ {formatFiat(fiat)}</span>
      )}
    </div>
  );
}
