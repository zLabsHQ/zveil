"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-danger-bg">
        <AlertTriangle className="size-5 text-danger-fg" strokeWidth={1.6} />
      </div>
      <div>
        <div className="text-[15px] font-semibold text-ink">Something went wrong</div>
        <p className="mt-1 max-w-[340px] text-sm leading-6 text-ink-soft">
          {error.message || "The page hit an unexpected error. Retry or reload."}
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
