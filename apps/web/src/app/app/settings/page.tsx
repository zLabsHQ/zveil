import { connection } from "next/server";
import { viewingKey, workspace } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Banner } from "@/components/feedback/empty-state";
import { ViewingKeyForm, BusinessForm } from "@/components/settings/forms";
import { Fingerprint } from "lucide-react";
import { NETWORKS } from "@/lib/network";
import { cn } from "@/lib/utils";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await connection();
  const ws = await workspace();
  const vk = await viewingKey();

  return (
    <div className="flex max-w-[720px] flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink-strong">Settings</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Workspace, network and payment detection.</p>
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border py-3.5">
          <CardTitle className="text-sm font-semibold">Payment detection</CardTitle>
          <CardDescription>Viewing-key only — Zveil can never spend</CardDescription>
        </CardHeader>
        <div className="px-5 py-4">
          {vk?.shared ? (
            <Banner tone="info" title="Using the shared testnet viewing key">
              Every sandbox can issue real, payable testnet invoices out of the box. Connect your own
              testnet UFVK below to receive into your own wallet — new invoices will use it.
            </Banner>
          ) : vk ? (
            <Banner tone="ok" title="Viewing key connected">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                <Fingerprint className="size-3" aria-hidden />
                {vk.fingerprint.slice(0, 8)}…{vk.fingerprint.slice(-6)} · {vk.network}
              </span>
            </Banner>
          ) : (
            <Banner tone="warn" title="No viewing key connected">
              Connect one below to start detecting payments.
            </Banner>
          )}
          <div className="mt-4">
            <ViewingKeyForm />
          </div>
        </div>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border py-3.5">
          <CardTitle className="text-sm font-semibold">Network</CardTitle>
          <CardDescription>Where invoices are issued and payments detected</CardDescription>
        </CardHeader>
        <div className="grid gap-2 px-5 py-4 sm:grid-cols-2">
          {NETWORKS.map((n) => (
            <div
              key={n.id}
              className={cn(
                "rounded-lg border p-3",
                n.live ? "border-brand-300 bg-brand-50/50 ring-1 ring-brand-200" : "border-border bg-paper",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-[13px] font-semibold", n.live ? "text-ink-strong" : "text-ink-muted")}>
                  {n.label}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em]",
                    n.live ? "bg-paid-bg text-paid-fg" : "bg-surface-sunken text-ink-muted",
                  )}
                >
                  {n.live ? "Active" : "Coming soon"}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">{n.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border py-3.5">
          <CardTitle className="text-sm font-semibold">Business</CardTitle>
        </CardHeader>
        <div className="px-5 py-4">
          <BusinessForm initialName={ws.businessName} />
        </div>
      </Card>
    </div>
  );
}

// Data comes from SQLite/scanner at request time — never prerender.
export const instant = false;
