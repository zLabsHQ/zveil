import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface-sunken">
        <FileQuestion className="size-5 text-ink-faint" strokeWidth={1.6} />
      </div>
      <div>
        <div className="text-[15px] font-semibold text-ink">Not found</div>
        <p className="mt-1 text-sm text-ink-soft">That invoice doesn&apos;t exist or was removed.</p>
      </div>
      <Link href="/app">
        <Button variant="secondary" size="sm">
          Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
