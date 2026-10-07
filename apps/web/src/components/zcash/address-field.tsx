"use client";

import { useState } from "react";
import { cn, truncateAddress } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

interface AddressFieldProps {
  label: string;
  value: string;
  copyValue?: string;
  className?: string;
}

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy to clipboard"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className={cn(
        "relative inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink cursor-pointer",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-paid-fg" strokeWidth={2.5} aria-hidden />
      ) : (
        <Copy className="size-3.5" strokeWidth={1.8} aria-hidden />
      )}
      <span
        className={cn(
          "pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-sm bg-ink-strong px-1.5 py-0.5 text-[11px] font-medium text-white transition-opacity duration-150",
          copied ? "opacity-100" : "opacity-0",
        )}
      >
        Copied
      </span>
    </button>
  );
}

export function AddressField({ label, value, copyValue, className }: AddressFieldProps) {
  return (
    <div
      className={cn(
        "flex h-11 items-center justify-between gap-2 rounded-md border border-border bg-surface px-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-xs font-medium text-ink-muted">{label}</span>
        <span className="truncate font-mono text-[13px] text-ink">
          {truncateAddress(value)}
        </span>
      </div>
      <CopyButton value={copyValue ?? value} />
    </div>
  );
}
