"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/zcash/address-field";
import { Download, KeyRound } from "lucide-react";

/** One-time display of a recovery code — copy it or download it as a file. */
export function RecoveryCode({ code, onDone }: { code: string; onDone?: () => void }) {
  const [saved, setSaved] = useState(false);
  const download = () => {
    const blob = new Blob(
      [`Zveil workspace recovery code\n\n${code}\n\nKeep this private — anyone with it can open your workspace.\n`],
      { type: "text/plain" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "zveil-recovery-code.txt";
    a.click();
    URL.revokeObjectURL(a.href);
    setSaved(true);
  };

  return (
    <div className="rounded-lg border border-pending-fg/25 bg-pending-bg p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-pending-fg">
        <KeyRound className="size-3.5" aria-hidden /> Recovery code — shown once
      </div>
      <p className="mt-1.5 text-[11px] leading-4 text-pending-fg/90">
        If your passkey is ever unavailable, this code reopens your workspace. Store it somewhere safe
        — Zveil can&apos;t show it again.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 rounded-md border border-pending-fg/20 bg-surface px-3 py-2 font-mono text-sm tracking-wide text-ink">
          {code}
        </code>
        <CopyButton value={code} />
        <Button variant="secondary" size="sm" onClick={download} className="gap-1.5">
          <Download className="size-3.5" aria-hidden /> Save
        </Button>
      </div>
      {onDone && (
        <Button size="sm" className="mt-3" disabled={!saved} onClick={onDone}>
          {saved ? "Done — I saved it" : "Save the code first"}
        </Button>
      )}
    </div>
  );
}
