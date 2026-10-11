import { NextResponse } from "next/server";
import { db, workspace } from "@/lib/db";
import { invoices, payments } from "@zveil/db";
import { and, eq, inArray } from "drizzle-orm";

// Remove the sandbox's sample history; real testnet invoices are untouched.
export async function DELETE() {
  const ws = await workspace();
  const rows = await db()
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.workspaceId, ws.id), eq(invoices.sample, true)));
  const ids = rows.map((r) => r.id);
  if (ids.length) {
    await db().delete(payments).where(inArray(payments.invoiceId, ids));
    await db().delete(invoices).where(inArray(invoices.id, ids));
  }
  return NextResponse.json({ ok: true, removed: ids.length });
}
