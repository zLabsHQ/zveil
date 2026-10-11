"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ZveilWordmark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Eye, ShieldCheck, ArrowRight, ArrowLeft, KeyRound, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkUfvk } from "@/lib/ufvk";

type Step = 0 | 1;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [ufvk, setUfvk] = useState("");
  const [ownKey, setOwnKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((s) => setShared(Boolean(s.sharedKey)))
      .catch(() => null);
  }, []);

  const finish = async () => {
    setError(null);
    if (ownKey && ufvk.trim()) {
      const check = checkUfvk(ufvk);
      if (!check.ok) return setError(check.message);
      setBusy(true);
      try {
        const r = await fetch("/api/accounts/keys", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ufvk: ufvk.trim() }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Failed to connect key");
      } catch (e) {
        setBusy(false);
        return setError(e instanceof Error ? e.message : "Failed to connect key");
      }
    } else {
      setBusy(true);
    }
    await fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ businessName: name.trim() || "My workspace" }),
    }).catch(() => null);
    router.push("/app");
  };

  return (
    <div className="veil-bg flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-[520px] justify-center px-4 py-6">
        <Link href="/">
          <ZveilWordmark />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[520px] flex-1 px-4 pb-16">
        {/* progress */}
        <div className="mb-6 flex items-center gap-1.5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-brand-600" : "bg-border")}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-lg">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <ShieldCheck className="size-6" strokeWidth={1.6} aria-hidden />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-ink-strong">
              Welcome to Zveil
            </h1>
            <p className="mx-auto mt-2 max-w-[360px] text-sm leading-6 text-ink-soft">
              Private books for money you&apos;re paid in Zcash. Invoices that reconcile themselves —
              and proof of income you can share without exposing anything else.
            </p>
            <Button size="lg" className="mt-6 w-full gap-2" onClick={() => setStep(1)}>
              Get started <ArrowRight className="size-4" aria-hidden />
            </Button>
            <p className="mt-4 text-[11px] leading-4 text-ink-faint">
              You&apos;ll get a private testnet workspace — no email, no password, no keys needed to
              start.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="rounded-xl border border-border bg-surface p-8 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand-600">
              <KeyRound className="size-3.5" aria-hidden /> Step 2 — your workspace
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink-strong">
              What should clients call you?
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              This name appears on your invoices, receipts and statements.
            </p>
            <div className="mt-5">
              <Label htmlFor="biz">Business or display name</Label>
              <Input
                id="biz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Lin Studio"
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={() => setOwnKey((v) => !v)}
              className="mt-5 flex w-full items-center justify-between rounded-md border border-border bg-surface-sunken px-3 py-2.5 text-left text-xs font-medium text-ink-soft transition-colors hover:text-ink"
            >
              <span className="flex items-center gap-1.5">
                <Eye className="size-3.5" aria-hidden /> I have my own viewing key (advanced)
              </span>
              <ChevronDown className={cn("size-4 transition-transform", ownKey && "rotate-180")} aria-hidden />
            </button>
            {ownKey && (
              <div className="mt-3">
                <Label htmlFor="ufvk">Unified Full Viewing Key (UFVK)</Label>
                <textarea
                  id="ufvk"
                  rows={3}
                  value={ufvk}
                  onChange={(e) => setUfvk(e.target.value)}
                  placeholder="uivktest1… (Zingo/Zashi testnet → Settings → Show viewing key)"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-ink placeholder:font-sans placeholder:text-ink-faint focus:border-brand-300 focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] leading-4 text-ink-muted">
                  A viewing key lets Zveil detect your payments — it can{" "}
                  <strong>never move your funds</strong>. Testnet keys start with{" "}
                  <span className="font-mono">uivktest1</span>; a mainnet{" "}
                  <span className="font-mono">uview1…</span> key won&apos;t work here.
                </p>
              </div>
            )}
            {error && <p className="mt-2 text-xs text-danger-fg">{error}</p>}

            <div className="mt-6 flex gap-3">
              <Button variant="secondary" onClick={() => setStep(0)} className="gap-1.5">
                <ArrowLeft className="size-4" aria-hidden /> Back
              </Button>
              <Button onClick={finish} disabled={busy} className="flex-1">
                {busy ? "Setting up…" : "Open workspace →"}
              </Button>
            </div>
            <p className="mt-4 rounded-md bg-surface-sunken px-3 py-2 text-[11px] leading-4 text-ink-muted">
              {shared && !ownKey
                ? "Your sandbox runs on a shared testnet viewing key, so you can issue payable invoices immediately. Test ZEC has no value — connect your own key later in Settings."
                : "Runs on Zcash testnet — test ZEC has no value."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
