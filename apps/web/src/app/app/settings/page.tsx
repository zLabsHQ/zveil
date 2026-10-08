import { connection } from "next/server";
import { viewingKey, workspace } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Banner } from "@/components/feedback/empty-state";
import { ViewingKeyForm, BusinessForm } from "@/components/settings/forms";
import { Fingerprint } from "lucide-react";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await connection();
  const ws = workspace();
  const vk = viewingKey();

  return (
    <div className="flex max-w-[640px] flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink-strong">Settings</h1>
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border py-3.5">
          <CardTitle className="text-sm font-semibold">Payment detection</CardTitle>
          <CardDescription>Viewing-key only — Zveil can never spend</CardDescription>
        </CardHeader>
        <div className="px-5 py-4">
          {vk ? (
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
