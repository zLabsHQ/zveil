import { connection } from "next/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { invoices, payments, workspaces } from "@zveil/db";
import { and, eq, isNull } from "drizzle-orm";
import { PayView } from "@/components/pay/pay-view";
import { Banner } from "@/components/feedback/empty-state";
import { zecUsd, fiatForZats } from "@/lib/pricing";


export default async function PayPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const [inv] = await db().select().from(invoices).where(eq(invoices.slug, slug)).limit(1);
  if (!inv || !inv.address || !inv.zip321Uri) notFound();
  const [ws] = await db().select().from(workspaces).where(eq(workspaces.id, inv.workspaceId)).limit(1);
  const pays = await db().select().from(payments).where(and(eq(payments.invoiceId, inv.id), isNull(payments.reorgedAt)));
  const paid = pays.reduce((s, p) => s + p.zats, 0);
  const rate = await zecUsd();

  return (
    <>
      {inv.status === "void" && (
        <div className="mx-auto max-w-[480px] px-4 pt-8">
          <Banner tone="danger" title="This invoice has been voided" />
        </div>
      )}
      <PayView
        invoiceId={inv.id}
        slug={slug}
        businessName={ws.businessName}
        seqLabel={`INV-${String(inv.seq ?? 0).padStart(4, "0")}`}
        clientNote={inv.description || inv.clientName}
        dueLabel={
          inv.dueDate
            ? new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : null
        }
        amountZats={inv.amountZats}
        fiat={inv.fiat}
        fiatAmount={
          inv.amountFiatCents
            ? inv.amountFiatCents / 100
            : rate
              ? fiatForZats(inv.amountZats, rate)
              : null
        }
        address={inv.address}
        zip321Uri={inv.zip321Uri}
        required={inv.confirmationsRequired}
        initialStatus={inv.status}
        paidZats={paid}
        demoMode={process.env.DEMO_MODE === "1"}
      />
    </>
  );
}

// Data comes from SQLite/scanner at request time — never prerender.
export const instant = false;
