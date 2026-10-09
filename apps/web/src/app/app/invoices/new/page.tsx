import { InvoiceEditor } from "@/components/invoice/invoice-editor";
import { workspace } from "@/lib/db";
import { zecUsd } from "@/lib/pricing";
import Link from "next/link";

export const metadata = { title: "New invoice" };

export default async function NewInvoicePage() {
  const ws = await workspace();
  const rate = await zecUsd();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/app/invoices" className="text-[13px] font-medium text-ink-muted hover:text-ink">
          ← Invoices
        </Link>
        <h1 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-ink-strong">New invoice</h1>
      </div>
      <InvoiceEditor businessName={ws.businessName} initialRate={rate} />
    </div>
  );
}

// Data comes from SQLite/scanner at request time — never prerender.
export const instant = false;
