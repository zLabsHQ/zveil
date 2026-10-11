"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Fingerprint, ChevronDown, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { loginWithPasskey, recoverWorkspace } from "@/lib/passkey";

export function LoginPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recover, setRecover] = useState(false);
  const [code, setCode] = useState("");

  const signIn = async () => {
    setBusy(true);
    setError(null);
    const res = await loginWithPasskey();
    setBusy(false);
    if (res.ok) router.push("/app");
    else setError(res.error);
  };

  const doRecover = async () => {
    setBusy(true);
    setError(null);
    const res = await recoverWorkspace(code);
    setBusy(false);
    if (res.ok) router.push("/app");
    else setError(res.error);
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center shadow-lg">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Fingerprint className="size-6" strokeWidth={1.6} aria-hidden />
      </div>
      <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-ink-strong">
        Open your workspace
      </h1>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        Sign in with the passkey that secures your workspace — Face ID, Touch ID, or your device
        PIN. No email, no password.
      </p>

      <Button size="lg" className="mt-6 w-full gap-2" onClick={signIn} disabled={busy}>
        <Fingerprint className="size-4" aria-hidden />
        {busy ? "Waiting for passkey…" : "Sign in with passkey"}
      </Button>
      {error && <p className="mt-2 text-xs text-danger-fg">{error}</p>}

      <div className="mt-4">
        <Link href="/app" className="text-sm font-medium text-brand-600 underline-offset-2 hover:underline">
          Open this device&apos;s workspace →
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setRecover((v) => !v)}
        className="mt-5 flex w-full items-center justify-between rounded-md border border-border bg-surface-sunken px-3 py-2.5 text-left text-xs font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <span className="flex items-center gap-1.5">
          <KeyRound className="size-3.5" aria-hidden /> Use a recovery code
        </span>
        <ChevronDown className={cn("size-4 transition-transform", recover && "rotate-180")} aria-hidden />
      </button>
      {recover && (
        <div className="mt-3 text-left">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="zv-xxxx-xxxx-xxxx"
            className="font-mono text-sm"
            spellCheck={false}
            onKeyDown={(e) => e.key === "Enter" && doRecover()}
          />
          <Button size="sm" className="mt-2 w-full" onClick={doRecover} disabled={busy || !code.trim()}>
            Recover workspace
          </Button>
        </div>
      )}
    </div>
  );
}
