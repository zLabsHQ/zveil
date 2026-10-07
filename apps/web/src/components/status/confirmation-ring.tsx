import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "motion/react";

interface ConfirmationRingProps {
  confirmed: number;
  required: number;
  size?: number;
  className?: string;
}

export function ConfirmationRing({
  confirmed,
  required,
  size = 40,
  className,
}: ConfirmationRingProps) {
  const done = confirmed >= required;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.min(confirmed / required, 1);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={done ? "Payment confirmed" : `${confirmed} of ${required} confirmations`}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={done ? "var(--color-paid-fg)" : "var(--color-pending-fg)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - frac) }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
        />
      </svg>
      {done ? (
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="inline-flex items-center justify-center rounded-full bg-paid-bg text-paid-fg"
          style={{ width: size * 0.55, height: size * 0.55 }}
        >
          <Check className="size-[55%]" strokeWidth={3} aria-hidden />
        </motion.span>
      ) : (
        <span className="tabular text-[11px] font-medium text-pending-fg">
          {confirmed}/{required}
        </span>
      )}
    </div>
  );
}
