import { connection } from "next/server";
import { createHash } from "node:crypto";
import { db, viewingKey, workspace } from "@/lib/db";
import { passkeys, recoveryCodes } from "@zveil/db";
import { count, eq } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Banner } from "@/components/feedback/empty-state";
import { ViewingKeyForm, BusinessForm } from "@/components/settings/forms";
import { SecurityCard } from "@/components/auth/security-card";
import { CopyButton } from "@/components/zcash/address-field";
import { publicKeyPem } from "@/lib/receipt";
import { Fingerprint } from "lucide-react";
import { NETWORKS } from "@/lib/network";
import { cn } from "@/lib/utils";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await connection();
  const ws = await workspace();
  const vk = await viewingKey();
  const [{ n: keyCount }] = await db()
    .select({ n: count() })
    .from(passkeys)
    .where(eq(passkeys.workspaceId, ws.id));
  const [recovery] = await db()
    .select({ usedAt: recoveryCodes.usedAt })
    .from(recoveryCodes)
    .where(eq(recoveryCodes.workspaceId, ws.id))
    .limit(1);
  const recoveryActive = !!recovery && !recovery.usedAt;
  const proofFingerprint = createHash("sha256").update(publicKeyPem()).digest("hex");

  return (
    <div className="flex max-w-[720px] flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink-strong">Settings</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Workspace, network and payment detection.</p>
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border py-3.5">
          <CardTitle className="text-sm font-semibold">Sign-in &amp; recovery</CardTitle>
          <CardDescription>Passkeys open this workspace on any device — no email, no password</CardDescription>
        </CardHeader>
        <SecurityCard />
      </Card>

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

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border py-3.5">
          <CardTitle className="text-sm font-semibold">Workspace identity</CardTitle>
          <CardDescription>What this workspace is, and the key that signs its proofs</CardDescription>
        </CardHeader>
        <div className="divide-y divide-border px-5">
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-[13px] text-ink-muted">Workspace ID</span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-ink">
              {ws.id}
              <CopyButton value={ws.id} />
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-[13px] text-ink-muted">Created</span>
            <span className="text-[13px] text-ink">
              {new Date(ws.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-[13px] text-ink-muted">Proof signing key</span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-ink">
              <Fingerprint className="size-3.5 text-ink-faint" aria-hidden />
              sha256 {proofFingerprint.slice(0, 12)}…{proofFingerprint.slice(-8)}
              <a
                href="/api/proofs/key"
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 underline-offset-2 hover:underline"
              >
                public key
              </a>
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-[13px] text-ink-muted">Access</span>
            <span className="text-[13px] text-ink">
              {keyCount > 0
                ? `${keyCount} passkey${keyCount === 1 ? "" : "s"}${recoveryActive ? " + recovery code" : ""}`
                : recoveryActive
                  ? "Recovery code"
                  : "This browser only — set up a passkey to secure it"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Data comes from Postgres/scanner at request time — never prerender.
export const instant = false;
