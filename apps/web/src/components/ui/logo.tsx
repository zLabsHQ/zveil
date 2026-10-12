import { cn } from "@/lib/utils";

export function ZveilMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Zveil"
    >
      <rect width="32" height="32" rx="9" fill="var(--color-ink-strong)" />
      <path
        d="M4 20 L28 14 L28 23 C28 25.2 26.2 27 24 27 L9 27 C6.2 27 4 25.2 4 23 Z"
        fill="white"
        opacity="0.22"
      />
      <path
        d="M11 11 L21 11 L13.5 21 L21 21"
        fill="none"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ZveilWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ZveilMark size={24} />
      <span className="text-[17px] font-semibold tracking-[-0.03em] text-ink-strong">
        zveil
      </span>
    </span>
  );
}
