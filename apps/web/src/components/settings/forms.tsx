"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { toast, Toaster } from "sonner";
import { checkUfvk } from "@/lib/ufvk";

export function ViewingKeyForm() {
  const router = useRouter();
  const [ufvk, setUfvk] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Toaster position="top-center" toastOptions={{ style: { fontSize: 13 } }} />
      <Label htmlFor="vk">Unified Full Viewing Key</Label>
      <textarea
        id="vk"
        rows={3}
        value={ufvk}
        onChange={(e) => setUfvk(e.target.value)}
        placeholder="uivktest1…"
        className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-ink placeholder:font-sans placeholder:text-ink-faint focus:border-brand-300 focus:outline-none"
      />
      {error && <p className="mt-1.5 text-xs text-danger-fg">{error}</p>}
      <p className="mt-1.5 text-[11px] text-ink-muted">
        Zingo or Zashi in testnet mode → Settings → Show viewing key. Testnet keys start with{" "}
        <span className="font-mono">uivktest1</span>.
      </p>
      <Button
        size="sm"
        variant="secondary"
        className="mt-3"
        disabled={busy}
        onClick={async () => {
          setError(null);
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
            if (!r.ok) throw new Error(j.error ?? "Failed");
            toast.success("Viewing key connected");
            setUfvk("");
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Connecting…" : "Connect key"}
      </Button>
    </div>
  );
}

export function BusinessForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <Label htmlFor="bizname">Business name</Label>
        <Input id="bizname" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <Button
        size="md"
        variant="secondary"
        disabled={busy || name.trim() === initialName}
        onClick={async () => {
          setBusy(true);
          await fetch("/api/settings", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ businessName: name.trim() }),
          });
          toast.success("Saved");
          setBusy(false);
          router.refresh();
        }}
      >
        Save
      </Button>
    </div>
  );
}
