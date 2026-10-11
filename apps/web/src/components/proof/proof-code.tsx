import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { CopyButton } from "@/components/zcash/address-field";

/** Signed zv1 proof code with copy + a link to the public verifier. */
export function ProofCode({ code, title = "Verification code" }: { code: string; title?: string }) {
  return (
    <div className="border-t border-border bg-surface-sunken px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.05em] text-ink-muted">
          <BadgeCheck className="size-3.5 text-paid-fg" aria-hidden />
          {title}
        </div>
        <div className="flex items-center gap-2">
          <CopyButton value={code} />
          <Link
            href={`/verify?r=${encodeURIComponent(code)}`}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Verify →
          </Link>
        </div>
      </div>
      <div className="mt-2 line-clamp-3 break-all font-mono text-[10px] leading-4 text-ink-faint">{code}</div>
      <p className="mt-2 text-[11px] leading-4 text-ink-muted">
        Signed with Zveil&apos;s Ed25519 key. Anyone can check it at{" "}
        <Link href="/verify" className="underline underline-offset-2">
          /verify
        </Link>{" "}
        — or offline with the public key at <span className="font-mono">/api/proofs/key</span>.
      </p>
    </div>
  );
}
