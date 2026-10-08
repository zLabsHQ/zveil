import { NextResponse } from "next/server";
import { scanner } from "@/lib/scanner";
import { zecUsd } from "@/lib/pricing";


export async function GET() {
  const [s, rate] = await Promise.all([scanner.status(), zecUsd()]);
  return NextResponse.json({
    scanner: s,
    network: s?.network ?? process.env.ZCASH_NETWORK ?? "regtest",
    latestHeight: s?.latestHeight ?? null,
    rateUsdPerZec: rate,
    demoMode: s ? s.mode === "demo" : true,
  });
}
