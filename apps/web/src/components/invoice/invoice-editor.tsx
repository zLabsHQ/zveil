"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { Amount } from "@/components/money/amount";
import { CopyButton } from "@/components/zcash/address-field";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Zap } from "lucide-react";
import { zecToZats } from "@zveil/zip321";

interface Item {
  description: string;
  qty: number;
  unitZec: string; // input as decimal ZEC
}

interface EditorState {
  clientName: string;
  clientEmail: string;
  description: string;
  dueDate: string;
  currency: "ZEC" | "USD";
  usdAmount: string;
  rate: number | null;
  rateLocked: boolean;
  items: Item[];
}

export function InvoiceEditor({
  businessName,
  initialRate,
}: {
  businessName: string;
  initialRate: number | null;
}) {
  const router = useRouter();
  const [s, setS] = useState<EditorState>({
    clientName: "",
    clientEmail: "",
    description: "",
    dueDate: "",
    currency: "ZEC",
    usdAmount: "",
    rate: initialRate,
    rateLocked: false,
    items: [{ description: "", qty: 1, unitZec: "" }],
  });
  const [busy, setBusy] = useState<"draft" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const itemsTotal = useMemo(
    () =>
      s.items.reduce((sum, it) => {
        const u = Number(it.unitZec);
        return sum + (Number.isFinite(u) ? u * (it.qty || 1) : 0);
      }, 0),
    [s.items],
  );

  const amountZec =
    s.currency === "USD"
      ? s.rate && s.rate > 0 && s.usdAmount
        ? Number(s.usdAmount) / s.rate
        : 0
      : itemsTotal > 0
        ? itemsTotal
        : 0;
  const amountZats = Math.round(amountZec * 1e8);
  const amountUsd =
    s.currency === "USD" ? Number(s.usdAmount) || 0 : s.rate ? amountZec * s.rate : null;

  const patch = (p: Partial<EditorState>) => setS((v) => ({ ...v, ...p }));
  const setItem = (i: number, p: Partial<Item>) =>
    setS((v) => ({ ...v, items: v.items.map((it, j) => (j === i ? { ...it, ...p } : it)) }));

  async function submit(send: boolean) {
    setError(null);
    if (!s.clientName.trim()) return setError("Client name is required");
    if (amountZats <= 0) return setError("Amount must be greater than zero");
    setBusy(send ? "send" : "draft");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientName: s.clientName.trim(),
          clientEmail: s.clientEmail.trim(),
          description: s.description.trim(),
          items: s.items
            .filter((it) => it.description.trim())
            .map((it) => ({
              description: it.description.trim(),
              qty: it.qty,
              unitZats: Number(zecToZats(it.unitZec || "0")),
            })),
          amountZats,
          fiat: s.currency === "USD" ? "USD" : undefined,
          amountFiatCents: s.currency === "USD" ? Math.round(Number(s.usdAmount) * 100) : undefined,
          rateFiatPerZec: s.currency === "USD" && s.rate ? s.rate : undefined,
          dueDate: s.dueDate ? new Date(s.dueDate).getTime() : undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed to create invoice");
      if (send) {
        const r2 = await fetch(`/api/invoices/${j.invoice.id}/send`, { method: "POST" });
        const j2 = await r2.json();
        if (!r2.ok) throw new Error(j2.error ?? "Failed to send");
      }
      router.push(`/app/invoices/${j.invoice.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const rateStale = s.currency === "USD" && s.rateLocked === false;

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_380px]">
      {/* editor */}
      <div className="flex flex-col gap-5">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
          <div className="text-sm font-semibold text-ink">Client</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="client">Client name</Label>
              <Input
                id="client"
                placeholder="Acme DAO"
                value={s.clientName}
                onChange={(e) => patch({ clientName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="accounts@acme.xyz"
                value={s.clientEmail}
                onChange={(e) => patch({ clientEmail: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="Brand refresh — deposit"
              value={s.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </div>
          <div className="mt-4 w-48">
            <Label htmlFor="due">Due date</Label>
            <Input
              id="due"
              type="date"
              value={s.dueDate}
              onChange={(e) => patch({ dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-ink">Amount</div>
            <div className="flex rounded-md border border-border bg-surface-sunken p-0.5">
              {(["ZEC", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => patch({ currency: c })}
                  className={cn(
                    "rounded-[6px] px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                    s.currency === c ? "bg-surface text-ink shadow-xs" : "text-ink-muted",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {s.currency === "USD" ? (
            <div className="mt-4">
              <Label htmlFor="usd">Amount in USD</Label>
              <div className="flex items-center gap-2">
                <div className="relative w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">$</span>
                  <Input
                    id="usd"
                    inputMode="decimal"
                    placeholder="140.00"
                    className="pl-6"
                    value={s.usdAmount}
                    onChange={(e) => patch({ usdAmount: e.target.value })}
                  />
                </div>
                {s.rate && (
                  <button
                    type="button"
                    onClick={() => patch({ rateLocked: !s.rateLocked })}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                      s.rateLocked
                        ? "border-brand-200 bg-brand-50 text-brand-700"
                        : "border-border text-ink-muted hover:text-ink",
                    )}
                  >
                    <Zap className="size-3" aria-hidden />
                    {s.rateLocked ? "Rate locked" : `1 ZEC ≈ $${s.rate.toFixed(2)}`}
                  </button>
                )}
              </div>
              {s.rate && s.usdAmount && (
                <p className="mt-1.5 text-xs text-ink-muted">
                  ≈ {amountZec.toFixed(4)} ZEC now — {rateStale ? "rate refreshes when you send" : "locked for this invoice"}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <div className="grid grid-cols-[1fr_60px_110px_110px_28px] items-center gap-2 text-[11px] font-medium uppercase tracking-[0.05em] text-ink-muted">
                <span>Item</span><span>Qty</span><span>Rate (ZEC)</span><span>Amount</span><span />
              </div>
              {s.items.map((it, i) => {
                const lineTotal = Number(it.unitZec) * (it.qty || 1);
                return (
                  <div key={i} className="grid grid-cols-[1fr_60px_110px_110px_28px] items-center gap-2">
                    <Input
                      placeholder="Line item"
                      value={it.description}
                      onChange={(e) => setItem(i, { description: e.target.value })}
                    />
                    <Input
                      inputMode="numeric"
                      value={String(it.qty)}
                      onChange={(e) => setItem(i, { qty: Number(e.target.value) || 1 })}
                    />
                    <Input
                      inputMode="decimal"
                      placeholder="0.00"
                      value={it.unitZec}
                      onChange={(e) => setItem(i, { unitZec: e.target.value })}
                    />
                    <div className="tabular text-sm text-ink-soft">
                      {lineTotal ? lineTotal.toFixed(4) : "—"}
                    </div>
                    <button
                      type="button"
                      aria-label="Remove line item"
                      onClick={() => setS((v) => ({ ...v, items: v.items.filter((_, j) => j !== i) }))}
                      className="inline-flex size-7 items-center justify-center rounded-sm text-ink-muted hover:bg-surface-hover hover:text-danger cursor-pointer"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setS((v) => ({ ...v, items: [...v.items, { description: "", qty: 1, unitZec: "" }] }))}
                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink cursor-pointer"
              >
                <Plus className="size-3.5" aria-hidden /> Add line item
              </button>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-medium text-ink-soft">Total</span>
                <Amount zats={amountZats} fiat={amountUsd} size="md" />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger-fg">{error}</p>}
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" disabled={busy !== null} onClick={() => submit(false)}>
            Save draft
          </Button>
          <Button size="lg" disabled={busy !== null} onClick={() => submit(true)}>
            {busy === "send" ? "Sending…" : "Send invoice →"}
          </Button>
        </div>
      </div>

      {/* live preview */}
      <div className="sticky top-20 max-lg:hidden">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-faint">
          Preview — what your client sees
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="h-[3px] w-full bg-brand-600" />
          <div className="px-5 pt-5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-ink-strong text-[11px] font-semibold text-white">
                {businessName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">{businessName}</div>
                <div className="text-xs text-ink-muted">
                  {s.description || "New invoice"}
                  {s.dueDate && ` · Due ${new Date(s.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                </div>
              </div>
            </div>
            <div className="mt-5">
              <Amount zats={amountZats} fiat={amountUsd} size="hero" />
            </div>
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between rounded-md border border-border bg-surface-sunken px-3 py-2.5">
                <span className="font-mono text-[12px] text-ink-muted">u1…address appears after sending</span>
                <CopyButton value="not-generated-yet" />
              </div>
            </div>
          </div>
          <div className="mt-5 border-t border-border px-5 py-3.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="size-2 animate-breathe rounded-full bg-open-fg" />
              <span className="font-medium text-ink">Waiting for payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
