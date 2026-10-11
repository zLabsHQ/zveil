"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUGGESTIONS: Record<string, string[]> = {
  overpaid: ["Credit applied to next invoice", "Refunded to client", "Accepted as tip"],
  underpaid: ["Client will pay balance", "Written off", "Discount agreed"],
  after_void: ["Refunded to client", "Re-issued as new invoice"],
};

export function ResolveException({ invoiceId, kind }: { invoiceId: string; kind: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const submit = (body: { note?: string; reopen?: boolean }) =>
    start(async () => {
      await fetch(`/api/invoices/${invoiceId}/reconcile`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {(SUGGESTIONS[kind] ?? []).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setNote(s)}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-ink-soft transition hover:border-border-strong hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit({ note });
        }}
      >
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Resolution note (kept in the audit trail)"
          className="h-8 text-[13px]"
          maxLength={500}
        />
        <Button size="sm" className="h-8 shrink-0" disabled={pending}>
          {pending ? "Saving…" : "Mark resolved"}
        </Button>
      </form>
    </div>
  );
}

export function ReopenException({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch(`/api/invoices/${invoiceId}/reconcile`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ reopen: true }),
          });
          router.refresh();
        })
      }
      className="text-xs font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline"
    >
      {pending ? "Reopening…" : "Reopen"}
    </button>
  );
}
