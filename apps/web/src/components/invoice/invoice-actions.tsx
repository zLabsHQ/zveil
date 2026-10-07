"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { Share2, Send, Ban, Link2 } from "lucide-react";

export function InvoiceActions({
  invoiceId,
  status,
  slug,
}: {
  invoiceId: string;
  status: string;
  slug: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function post(path: string, body?: unknown) {
    const r = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error ?? `Request failed (${r.status})`);
    return j;
  }

  const send = async () => {
    setBusy("send");
    try {
      await post(`/api/invoices/${invoiceId}/send`);
      toast.success("Invoice sent — share the link");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy("share");
    try {
      const j = await post(`/api/invoices/${invoiceId}/disclosures`, { label: "Viewer" });
      const url = `${location.origin}${j.url}`;
      await navigator.clipboard.writeText(url);
      toast.success("Private share link copied");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const void_ = async () => {
    setBusy("void");
    try {
      await post(`/api/invoices/${invoiceId}/void`);
      toast.success("Invoice voided");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const base = typeof window !== "undefined" ? location.origin : "";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toaster position="top-center" toastOptions={{ style: { fontSize: 13 } }} />
      {status === "draft" && (
        <Button size="sm" onClick={send} disabled={busy !== null} className="gap-1.5">
          <Send className="size-3.5" aria-hidden /> Send invoice
        </Button>
      )}
      {slug && (
        <>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5"
            onClick={async () => {
              await navigator.clipboard.writeText(`${base}/i/${slug}`);
              toast.success("Payment link copied");
            }}
          >
            <Link2 className="size-3.5" aria-hidden /> Copy payment link
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5"
            onClick={share}
            disabled={busy !== null}
          >
            <Share2 className="size-3.5" aria-hidden /> Share privately
          </Button>
        </>
      )}
      {status !== "paid" && status !== "void" && status !== "draft" && (
        <Button size="sm" variant="danger" onClick={void_} disabled={busy !== null} className="gap-1.5">
          <Ban className="size-3.5" aria-hidden /> Void
        </Button>
      )}
    </div>
  );
}

export function InvoiceLinkRow({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(`${location.origin}/i/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="group relative flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 transition-colors hover:bg-surface-hover"
    >
      <span className="truncate font-mono text-[12px] text-ink-soft">/i/{slug}</span>
      <span className="text-[11px] font-medium text-ink-faint transition-colors group-hover:text-ink">
        {copied ? "Copied" : "Copy link"}
      </span>
    </button>
  );
}
