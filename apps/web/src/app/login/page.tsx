import Link from "next/link";
import { ZveilWordmark } from "@/components/ui/logo";
import { LoginPanel } from "@/components/auth/login-panel";

export const metadata = { title: "Log in" };

export default function Login() {
  return (
    <div className="veil-bg flex flex-1 flex-col items-center justify-center px-4">
      <Link href="/">
        <ZveilWordmark />
      </Link>
      <div className="mt-8 flex w-full justify-center">
        <LoginPanel />
      </div>
      <p className="mt-5 max-w-sm text-center text-[11px] leading-4 text-ink-faint">
        Workspaces are private by default. A passkey links a workspace to you so it opens on any
        device — without an email or password.
      </p>
    </div>
  );
}
