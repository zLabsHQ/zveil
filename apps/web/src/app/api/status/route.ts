import { NextResponse } from "next/server";
import { scanner } from "@/lib/scanner";
import { zecUsd } from "@/lib/pricing";
import { restoreSharedAccount, sharedKeyConfigured } from "@/lib/shared-key";

export async function GET() {
  const [s, rate] = await Promise.all([scanner.status(), zecUsd()]);
  // Scanner state is in-memory: if it restarted, re-watch the shared key's
  // open invoices so detection resumes without anyone noticing.
  if (s && s.mode === "chain" && s.accounts === 0 && sharedKeyConfigured()) {
    await restoreSharedAccount().catch(() => null);
  }
  return NextResponse.json({
    scanner: s,
    network: s?.network ?? process.env.ZCASH_NETWORK ?? "testnet",
    latestHeight: s?.latestHeight ?? null,
    rateUsdPerZec: rate,
    demoMode: s ? s.mode === "demo" : false,
    sharedKey: sharedKeyConfigured(),
  });
}
