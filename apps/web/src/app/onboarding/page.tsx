"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ZveilWordmark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Eye, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [ufvk, setUfvk] = useState("");
  const [name, setName] = useState("Maya Lin Studio");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fp, setFp] = useState<string | null>(null);

  const connect = async () => {
    setError(null);
    if (ufvk.trim().length < 32) return setError("Paste a Unified Full Viewing Key (uview…)");
    setBusy(true);
    try {
      const r = await fetch("/api/accounts/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ufvk: ufvk.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setFp(j.fingerprint);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ businessName: name }),
    }).catch(() => null);
    router.push("/app");
  };

  return (
    <div className="veil-bg flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-[520px] justify-center px-4 py-6">
        <Link href="/">
          <ZveilWordmark />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[520px] flex-1 px-4 pb-16">
        {/* progress */}
        <div className="mb-6 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
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
              Send invoices your clients pay privately in Zcash. Two quick steps and your first
              invoice is live.
            </p>
            <Button size="lg" className="mt-6 w-full gap-2" onClick={() => setStep(1)}>
              Get started <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="rounded-xl border border-border bg-surface p-8 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand-600">
              <Eye className="size-3.5" aria-hidden /> Step 2 — payment detection
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink-strong">
              Connect a viewing key
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Zveil reads incoming payments with a <strong>Unified Full Viewing Key</strong> from your
              wallet. It can see your income — it can{" "}
              <strong className="text-ink">never move your funds</strong>. Your spending key never
              leaves your wallet.
            </p>
            <div className="mt-5">
              <Label htmlFor="ufvk">Unified Full Viewing Key (UFVK)</Label>
              <textarea
                id="ufvk"
                rows={3}
                value={ufvk}
                onChange={(e) => setUfvk(e.target.value)}
                placeholder="uview1… (from ZODL → Settings → Show viewing key)"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-ink placeholder:font-sans placeholder:text-ink-faint focus:border-brand-300 focus:outline-none"
              />
              {error && <p className="mt-1.5 text-xs text-danger-fg">{error}</p>}
            </div>
            <div className="mt-5 flex gap-3">
              <Button variant="secondary" onClick={() => setStep(0)} className="gap-1.5">
                <ArrowLeft className="size-4" aria-hidden /> Back
              </Button>
              <Button onClick={connect} disabled={busy} className="flex-1">
                {busy ? "Connecting…" : "Connect key →"}
              </Button>
            </div>
            <p className="mt-4 rounded-md bg-surface-sunken px-3 py-2 text-[11px] leading-4 text-ink-muted">
              Demo: any valid-looking <span className="font-mono">uview…</span> string works when the
              scanner is in demo mode.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-xl border border-border bg-surface p-8 shadow-lg">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-paid-bg px-2.5 py-1 text-xs font-medium text-paid-fg">
              <ShieldCheck className="size-3" aria-hidden /> Key connected{fp ? ` · …${fp.slice(-6)}` : ""}
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-ink-strong">
              What should clients call you?
            </h1>
            <div className="mt-5">
              <Label htmlFor="biz">Business or display name</Label>
              <Input id="biz" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button size="lg" onClick={finish} disabled={busy} className="mt-6 w-full gap-2">
              Go to dashboard <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
