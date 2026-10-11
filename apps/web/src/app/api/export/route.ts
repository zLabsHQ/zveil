import { db, workspace, paymentsFor } from "@/lib/db";
import { invoices } from "@zveil/db";
import { eq } from "drizzle-orm";
import { zatsToZec } from "@z-labs/zip321";

function csvEscape(s: string | null | undefined): string {
  const v = s ?? "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET() {
  const invs = await db().select().from(invoices).where(eq(invoices.workspaceId, (await workspace()).id));
  const pays = await paymentsFor(invs.map((i) => i.id));
  const paysBy = new Map<string, typeof pays>();
  for (const p of pays) {
    const list = paysBy.get(p.invoiceId) ?? [];
    list.push(p);
    paysBy.set(p.invoiceId, list);
  }

  const header = [
    "invoice", "client", "status", "amount_zec", "fiat_amount", "fiat_currency",
    "rate_usd_per_zec", "due_date", "created", "paid_at", "paid_zec", "txids", "memo",
  ];
  const lines = [header.join(",")];
  for (const i of invs) {
    const ps = paysBy.get(i.id) ?? [];
    const paid = ps.reduce((s, p) => s + p.zats, 0);
    lines.push(
      [
        `INV-${i.seq ?? "DRAFT"}`,
        csvEscape(i.clientName),
        i.status,
        zatsToZec(i.amountZats),
        i.amountFiatCents ? (i.amountFiatCents / 100).toFixed(2) : "",
        i.fiat ?? "",
        i.rateFiatPerZec ?? "",
        i.dueDate ? new Date(i.dueDate).toISOString().slice(0, 10) : "",
        new Date(i.createdAt).toISOString(),
        i.paidAt ? new Date(i.paidAt).toISOString() : "",
        zatsToZec(paid),
        ps.map((p) => p.txid).join(";"),
        csvEscape(i.memoSeed),
      ].join(","),
    );
  }
  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv",
      "content-disposition": `attachment; filename="zveil-invoices.csv"`,
    },
  });
}
