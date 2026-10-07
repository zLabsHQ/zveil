import { viewingKey, workspace } from "@/lib/db";
import { Card, CardHeader } from "@/components/ui/card";
import { Banner } from "@/components/feedback/empty-state";
import { ViewingKeyForm, BusinessForm } from "@/components/settings/forms";
import { Fingerprint } from "lucide-react";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const ws = workspace();
  const vk = viewingKey();

  return (
    <div className="flex max-w-[640px] flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink-strong">Settings</h1>
      </div>

      <Card>
        <CardHeader title="Payment detection" hint="Viewing-key only — Zveil can never spend" />
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

      <Card>
        <CardHeader title="Business" />
        <div className="px-5 py-4">
          <BusinessForm initialName={ws.businessName} />
        </div>
      </Card>
    </div>
  );
}
