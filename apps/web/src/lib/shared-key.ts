import { createDb, invoices, viewingKeys } from "@zveil/db";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { scanner, webhookUrl } from "./scanner";

// A shared testnet viewing key lets every sandbox create real, payable
// invoices with zero setup. Addresses stay unique because the diversifier
// counter is keyed by scanner account, not by workspace.
export const SHARED_ACCOUNT_ID = "acct_shared_testnet";

export const sharedKeyConfigured = () => Boolean(process.env.SHARED_TESTNET_UFVK);

const WATCHED = ["open", "seen", "partially_paid", "overdue"];
let inflight: Promise<void> | null = null;

/**
 * The scanner keeps accounts in memory. After a restart, re-import the shared
 * key under its stable id and re-allocate every open invoice address so
 * detection resumes. Safe to call repeatedly; concurrent calls coalesce.
 */
export function restoreSharedAccount(): Promise<void> {
  const ufvk = process.env.SHARED_TESTNET_UFVK;
  if (!ufvk) return Promise.resolve();
  inflight ??= (async () => {
    await scanner.importAccount(ufvk, webhookUrl(), SHARED_ACCOUNT_ID);
    const db = createDb(process.env.DATABASE_URL!);
    const open = await db
      .select({ d: invoices.diversifierIndex })
      .from(invoices)
      .innerJoin(viewingKeys, eq(invoices.viewingKeyId, viewingKeys.id))
      .where(
        and(
          eq(viewingKeys.scannerAccountId, SHARED_ACCOUNT_ID),
          inArray(invoices.status, WATCHED),
          isNotNull(invoices.diversifierIndex),
        ),
      );
    for (const { d } of open) await scanner.allocateAddress(SHARED_ACCOUNT_ID, d!);
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Allocate an address, transparently recovering the shared account once. */
export async function allocateAddress(scannerAccountId: string, diversifier: number) {
  try {
    return await scanner.allocateAddress(scannerAccountId, diversifier);
  } catch (e) {
    const missing = e instanceof Error && e.message.includes("→ 404");
    if (!missing || scannerAccountId !== SHARED_ACCOUNT_ID || !sharedKeyConfigured()) throw e;
    await restoreSharedAccount();
    return scanner.allocateAddress(scannerAccountId, diversifier);
  }
}
