"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RecoveryCode } from "@/components/auth/recovery-code";
import { Fingerprint, X } from "lucide-react";
import { registerPasskey, useLocalFlag, usePasskeysSupported } from "@/lib/passkey";

const DISMISS_KEY = "zv_secure_dismissed";

/** Dashboard prompt: this workspace only lives in this browser — secure it with a passkey. */
export function SecureBanner() {
  const supported = usePasskeysSupported();
  const dismissed = useLocalFlag(DISMISS_KEY);
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const show = supported && !dismissed && !closed;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setClosed(true);
  };

  const secure = async () => {
    setBusy(true);
    setError(null);
    const res = await registerPasskey();
    setBusy(false);
    if (res.ok) {
      if (res.recoveryCode) setCode(res.recoveryCode);
      else dismiss();
    } else setError(res.error);
  };

  if (!show) return null;

  return (
    <div className="rounded-xl border border-pending-fg/25 bg-pending-bg p-4">
      {code ? (
        <RecoveryCode code={code} onDone={dismiss} />
      ) : (
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-pending-fg">
            <Fingerprint className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-ink">Secure this workspace</div>
            <p className="mt-0.5 text-xs leading-4 text-ink-muted">
              It only exists in this browser — clear site data and it&apos;s gone. Link a passkey
              (Face ID / Touch ID) so it opens on any device.
            </p>
            {error && <p className="mt-1.5 text-xs text-danger-fg">{error}</p>}
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" onClick={secure} disabled={busy} className="gap-1.5">
                <Fingerprint className="size-3.5" aria-hidden />
                {busy ? "Waiting for passkey…" : "Secure with passkey"}
              </Button>
              <button
                type="button"
                onClick={dismiss}
                className="text-xs font-medium text-ink-muted transition-colors hover:text-ink"
              >
                Later
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md p-1 text-ink-faint transition-colors hover:text-ink"
            aria-label="Dismiss"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
