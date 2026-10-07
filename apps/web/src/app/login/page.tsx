import Link from "next/link";
import { ZveilWordmark } from "@/components/ui/logo";

export const metadata = { title: "Log in" };

export default function Login() {
  return (
    <div className="veil-bg flex min-h-full flex-col items-center justify-center px-4">
      <Link href="/">
        <ZveilWordmark />
      </Link>
      <h1 className="mt-8 text-2xl font-semibold tracking-[-0.02em] text-ink-strong">Log in</h1>
      <p className="mt-2 max-w-sm text-center text-sm leading-6 text-ink-soft">
        Sign-in is coming with the dashboard. For now this page is a placeholder.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
      >
        ← Back to Zveil
      </Link>
    </div>
  );
}
