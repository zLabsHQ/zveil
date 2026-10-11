import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createDb, type Db, workspaces, viewingKeys, invoices, payments } from "@zveil/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { WS_COOKIE, WS_HEADER, isWorkspaceId } from "./workspace-id";
import { seedSampleData } from "./sample";
import { SHARED_ACCOUNT_ID, sharedKeyConfigured } from "./shared-key";
import { id as newId } from "./id";

let _db: Db | null = null;

// Postgres via Neon HTTP (DATABASE_URL). Schema is applied out-of-band with
// `pnpm --filter @zveil/db db:push`, so the client is cheap to create.
export function db(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _db = createDb(url);
  }
  return _db;
}

export const SANDBOX_CONFIRMATIONS = Number(process.env.SANDBOX_CONFIRMATIONS ?? 1);

/** The visitor's workspace id — set by src/proxy.ts on first visit. */
export async function workspaceId(): Promise<string> {
  const fromCookie = (await cookies()).get(WS_COOKIE)?.value;
  if (fromCookie && isWorkspaceId(fromCookie)) return fromCookie;
  const fromHeader = (await headers()).get(WS_HEADER);
  if (fromHeader && isWorkspaceId(fromHeader)) return fromHeader;
  throw new Error("No workspace on request");
}

async function provision(id: string) {
  const created = await db()
    .insert(workspaces)
    .values({
      id,
      businessName: "zLabs Studio",
      network: "testnet",
      defaultConfirmations: SANDBOX_CONFIRMATIONS,
      createdAt: Date.now(),
    })
    .onConflictDoNothing()
    .returning({ id: workspaces.id });
  if (created.length === 0) return; // a concurrent request already provisioned it

  if (sharedKeyConfigured()) {
    await db().insert(viewingKeys).values({
      id: newId(),
      workspaceId: id,
      fingerprint: process.env.SHARED_TESTNET_FINGERPRINT ?? "shared-testnet",
      network: "testnet",
      scannerAccountId: SHARED_ACCOUNT_ID,
      shared: true,
      keyRef: "env:SHARED_TESTNET_UFVK",
      createdAt: Date.now(),
    });
  }
  await seedSampleData(id);
}

// cache(): one lookup per request, however many components ask for it.
export const workspace = cache(async () => {
  const id = await workspaceId();
  let [ws] = await db().select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
  if (!ws) {
    await provision(id);
    [ws] = await db().select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
  }
  return ws;
});

/** The workspace's active key — a user-connected key wins over the shared one. */
export const viewingKey = cache(async () => {
  const ws = await workspace();
  const rows = await db().select().from(viewingKeys).where(eq(viewingKeys.workspaceId, ws.id));
  return rows.sort((a, b) => Number(a.shared) - Number(b.shared) || b.createdAt - a.createdAt)[0] ?? null;
});

/** Load an invoice only if it belongs to the current workspace. */
export async function ownedInvoice(invoiceId: string) {
  const ws = await workspace();
  const [inv] = await db()
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.workspaceId, ws.id)))
    .limit(1);
  return inv ?? null;
}

/** Live (non-reorged) payments for a set of invoices. */
export async function paymentsFor(invoiceIds: string[]) {
  if (invoiceIds.length === 0) return [];
  return db()
    .select()
    .from(payments)
    .where(and(inArray(payments.invoiceId, invoiceIds), isNull(payments.reorgedAt)));
}
