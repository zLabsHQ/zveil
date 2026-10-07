// ZEC/USD rate with a 60s cache; median of available sources.
// Falls back to null — callers must treat fiat as "unavailable", never zero.

let cache: { rate: number; at: number } | null = null;

async function coingecko(): Promise<number | null> {
  const r = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=zcash&vs_currencies=usd",
    { signal: AbortSignal.timeout(4_000), next: { revalidate: 0 } },
  ).catch(() => null);
  if (!r?.ok) return null;
  const j = (await r.json()) as { zcash?: { usd?: number } };
  return j.zcash?.usd ?? null;
}

async function kraken(): Promise<number | null> {
  const r = await fetch("https://api.kraken.com/0/public/Ticker?pair=ZECUSD", {
    signal: AbortSignal.timeout(4_000),
  }).catch(() => null);
  if (!r?.ok) return null;
  const j = (await r.json()) as { result?: Record<string, { c?: string[] }> };
  const pair = Object.values(j.result ?? {})[0];
  const price = Number(pair?.c?.[0]);
  return Number.isFinite(price) ? price : null;
}

export async function zecUsd(): Promise<number | null> {
  if (cache && Date.now() - cache.at < 60_000) return cache.rate;
  const [a, b] = await Promise.all([coingecko(), kraken()]);
  const live = [a, b].filter((x): x is number => x != null && x > 0).sort((x, y) => x - y);
  if (live.length === 0) return null;
  const rate = live[Math.floor(live.length / 2)];
  cache = { rate, at: Date.now() };
  return rate;
}

export function fiatForZats(zats: number, rateUsdPerZec: number): number {
  return (zats / 1e8) * rateUsdPerZec;
}
