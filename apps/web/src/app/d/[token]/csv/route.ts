import { db } from "@/lib/db";
import { disclosures } from "@zveil/db";
import { eq } from "drizzle-orm";
import { zatsToZec } from "@z-labs/zip321";
import { buildStatement, isoDay } from "@/lib/statement";

type Ctx = { params: Promise<{ token: string }> };

const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// Accountant-ready CSV for a live statement link; dies with the link.
export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const [d] = await db().select().from(disclosures).where(eq(disclosures.token, token)).limit(1);
  if (!d || d.kind !== "statement" || d.revokedAt || d.expiresAt < Date.now() || !d.workspaceId || d.periodFrom == null || d.periodTo == null)
    return new Response("Link expired or revoked", { status: 404 });

  const s = await buildStatement(d.workspaceId, d.periodFrom, d.periodTo);
  const lines = [
    ["date", "invoice", "client", "pool", "amount_zec", "usd_at_receipt", "txid", "sample"].join(","),
    ...s.rows.map((r) =>
      [isoDay(r.at), r.invoice, esc(r.client), r.pool, zatsToZec(r.zats), r.usdCents == null ? "" : (r.usdCents / 100).toFixed(2), r.txid, r.sample ? "yes" : ""].join(","),
    ),
    "",
    `# total_zec,${zatsToZec(s.zats)}`,
    `# total_usd_at_receipt,${s.usdCents == null ? "" : (s.usdCents / 100).toFixed(2)}`,
    `# zveil_proof,${s.proof}`,
  ];
  const name = `zveil-statement-${isoDay(d.periodFrom)}-to-${isoDay(d.periodTo)}.csv`;
  return new Response(lines.join("\n") + "\n", {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"` },
  });
}
