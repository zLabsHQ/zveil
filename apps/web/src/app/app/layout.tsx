import { AppShell } from "@/components/shell/app-shell";
import { redirect } from "next/navigation";
import { viewingKey } from "@/lib/db";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Demo-mode guard: if no viewing key is connected, send user to onboarding.
  if (!viewingKey()) redirect("/onboarding");
  return <AppShell>{children}</AppShell>;
}
