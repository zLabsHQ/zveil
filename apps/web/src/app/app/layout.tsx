import { connection } from "next/server";
import { AppShell } from "@/components/shell/app-shell";
import { redirect } from "next/navigation";
import { viewingKey } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await connection();
  // Demo-mode guard: if no viewing key is connected, send user to onboarding.
  if (!viewingKey()) redirect("/onboarding");
  return <AppShell>{children}</AppShell>;
}

// Data comes from SQLite/scanner at request time — never prerender.
export const instant = false;
