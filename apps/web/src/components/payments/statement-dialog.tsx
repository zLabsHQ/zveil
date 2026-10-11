"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CopyButton } from "@/components/zcash/address-field";
import { cn } from "@/lib/utils";

const day = (d: Date) => d.toISOString().slice(0, 10);

/** Presets in UTC, matching how statements are bounded server-side. */
function presets(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const q = Math.floor(m / 3);
  const utc = (yy: number, mm: number, dd: number) => new Date(Date.UTC(yy, mm, dd));
  return [
    { id: "this-month", label: "This month", from: utc(y, m, 1), to: now },
    { id: "last-month", label: "Last month", from: utc(y, m - 1, 1), to: utc(y, m, 0) },
    { id: "this-quarter", label: "This quarter", from: utc(y, q * 3, 1), to: now },
    { id: "last-quarter", label: "Last quarter", from: utc(y, q * 3 - 3, 1), to: utc(y, q * 3, 0) },
    { id: "ytd", label: "Year to date", from: utc(y, 0, 1), to: now },
    { id: "last-90", label: "Last 90 days", from: new Date(now.getTime() - 89 * 86_400_000), to: now },
  ].map((p) => ({ ...p, from: day(p.from), to: day(p.to) }));
}

const EXPIRY = [7, 30, 90];

export function ShareStatementButton() {
  const router = useRouter();
  const options = presets();
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState("last-90");
  const [range, setRange] = useState({ from: options[5].from, to: options[5].to });
  const [label, setLabel] = useState("Accountant");
  const [days, setDays] = useState(30);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const pick = (id: string) => {
    const p = options.find((o) => o.id === id)!;
    setPreset(id);
    setRange({ from: p.from, to: p.to });
  };

  const create = () =>
    start(async () => {
      setError(null);
      const r = await fetch("/api/statements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...range, label, days }),
      });
      const j = await r.json();
      if (!r.ok) return setError(j.error ?? "Could not create the statement");
      setUrl(`${window.location.origin}${j.url}`);
      router.refresh();
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setUrl(null);
      }}
    >
      <DialogTrigger render={<Button size="sm" className="h-8 gap-1.5" />}>
        <FileText className="size-3.5" aria-hidden /> Share income statement
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Share an income statement</DialogTitle>
          <DialogDescription>
            A signed, read-only link listing only the payments you received in this period — for an accountant,
            auditor or grant committee. Nothing else in your wallet is visible.
          </DialogDescription>
        </DialogHeader>

        {url ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-md border border-border bg-paper px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{url}</span>
              <CopyButton value={url} />
            </div>
            <div className="flex gap-2">
              <a href={url} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">
                  Open statement
                </Button>
              </a>
              <Button size="sm" variant="ghost" onClick={() => setUrl(null)}>
                Create another
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-1.5 text-xs font-medium text-ink-soft">Period</div>
              <div className="flex flex-wrap gap-1.5">
                {options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => pick(o.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition",
                      preset === o.id
                        ? "border-ink-strong bg-ink-strong text-white"
                        : "border-border text-ink-soft hover:border-border-strong hover:text-ink",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={range.from}
                  max={range.to}
                  onChange={(e) => {
                    setPreset("custom");
                    setRange((r) => ({ ...r, from: e.target.value }));
                  }}
                  aria-label="From"
                  className="h-8 text-[13px]"
                />
                <Input
                  type="date"
                  value={range.to}
                  min={range.from}
                  onChange={(e) => {
                    setPreset("custom");
                    setRange((r) => ({ ...r, to: e.target.value }));
                  }}
                  aria-label="To"
                  className="h-8 text-[13px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <div className="mb-1.5 text-xs font-medium text-ink-soft">Shared with</div>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} className="h-8 text-[13px]" />
              </div>
              <div>
                <div className="mb-1.5 text-xs font-medium text-ink-soft">Expires in</div>
                <div className="flex h-8 overflow-hidden rounded-md border border-border">
                  {EXPIRY.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDays(d)}
                      className={cn(
                        "px-2.5 text-xs transition",
                        days === d ? "bg-surface-sunken font-semibold text-ink" : "text-ink-muted hover:text-ink",
                      )}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && <p className="text-xs text-danger-fg">{error}</p>}
            <Button onClick={create} disabled={pending || !label.trim()}>
              {pending ? "Creating…" : "Create signed link"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function RevokeStatementButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch(`/api/statements/${id}`, { method: "DELETE" });
          router.refresh();
        })
      }
      className="text-xs font-medium text-ink-muted hover:text-danger-fg"
    >
      {pending ? "Revoking…" : "Revoke"}
    </button>
  );
}
