import { connection } from "next/server";
import { AppShell } from "@/components/shell/app-shell";
import { redirect } from "next/navigation";
import { viewingKey, workspace } from "@/lib/db";
import { exceptions, loadLedger } from "@/lib/ledger";

/* eslint-disable react-hooks/purity -- server component; render-time clocks are fine here */

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const ws = await workspace();
  // Sandboxes come with the shared testnet key; without one, onboard first.
  if (!(await viewingKey())) redirect("/onboarding");
  const open = exceptions(await loadLedger(ws.id), Date.now()).filter((e) => !e.resolved).length;
  return (
    <AppShell workspaceName={ws.businessName} exceptions={open}>
      {children}
    </AppShell>
  );
}

// Per-visitor data at request time — never prerender.
export const instant = false;
