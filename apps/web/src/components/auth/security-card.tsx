"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RecoveryCode } from "@/components/auth/recovery-code";
import { Fingerprint, KeyRound, Plus, Trash2 } from "lucide-react";
import { registerPasskey, usePasskeysSupported } from "@/lib/passkey";
import { cn } from "@/lib/utils";

type Key = { id: string; name: string; createdAt: number; lastUsedAt: number | null; deviceType: string | null; backedUp: boolean };
type State = { passkeys: Key[]; recoveryAvailable: boolean } | null;

const fmt = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function SecurityCard() {
  const [state, setState] = useState<State>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const supported = usePasskeysSupported();

  const refresh = useCallback(
    () => fetch("/api/auth/passkeys").then((r) => r.json()).then(setState).catch(() => null),
    [],
  );
  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async () => {
    setBusy(true);
    setError(null);
    const res = await registerPasskey();
    setBusy(false);
    if (res.ok) {
      if (res.recoveryCode) setCode(res.recoveryCode);
      refresh();
    } else setError(res.error);
  };

  const rotate = async () => {
    setBusy(true);
    const res = await fetch("/api/auth/recovery", { method: "POST" }).then((r) => r.json()).catch(() => null);
    setBusy(false);
    if (res?.code) setCode(res.code);
  };

  const remove = async (id: string) => {
    await fetch(`/api/auth/passkeys/${id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <div className="px-5 py-4">
      {code && <RecoveryCode code={code} onDone={() => setCode(null)} />}

      {state === null ? (
        <div className="h-10 animate-pulse rounded-md bg-surface-sunken" />
      ) : state.passkeys.length === 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-pending-fg/25 bg-pending-bg px-4 py-3">
          <div>
            <div className="text-[13px] font-semibold text-ink">This workspace lives only in this browser</div>
            <p className="mt-0.5 text-xs text-ink-muted">
              Add a passkey so it opens on any device — clear site data and it&apos;s gone without one.
            </p>
          </div>
          {supported && (
            <Button onClick={add} disabled={busy} className="shrink-0 gap-1.5">
              <Fingerprint className="size-4" aria-hidden /> {busy ? "Waiting…" : "Secure it"}
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {state.passkeys.map((k) => (
            <div key={k.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Fingerprint className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-ink">{k.name}</div>
                <div className="text-[11px] text-ink-muted">
                  Added {fmt(k.createdAt)}
                  {k.lastUsedAt ? ` · last used ${fmt(k.lastUsedAt)}` : " · not used yet"}
                </div>
              </div>
              {k.deviceType && (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    k.deviceType === "multiDevice" ? "bg-paid-bg text-paid-fg" : "bg-surface-sunken text-ink-muted",
                  )}
                >
                  {k.deviceType === "multiDevice" ? "Syncs across devices" : "This device only"}
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(k.id)}
                className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-danger-bg hover:text-danger-fg"
                aria-label={`Remove ${k.name}`}
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-danger-fg">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {state !== null && state.passkeys.length > 0 && supported && (
          <Button variant="secondary" size="sm" onClick={add} disabled={busy} className="gap-1.5">
            <Plus className="size-3.5" aria-hidden /> Add passkey
          </Button>
        )}
        {state !== null && state.passkeys.length > 0 && (
          <Button variant="secondary" size="sm" onClick={rotate} disabled={busy} className="gap-1.5">
            <KeyRound className="size-3.5" aria-hidden /> New recovery code
          </Button>
        )}
        <span className={cn("text-[11px]", state?.recoveryAvailable ? "text-paid-fg" : "text-ink-faint")}>
          {state?.recoveryAvailable ? "Recovery code active" : ""}
        </span>
      </div>
    </div>
  );
}
