const SCANNER_URL = process.env.SCANNER_URL ?? "http://127.0.0.1:8080";
const TOKEN = process.env.SCANNER_TOKEN ?? "dev-token";

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${SCANNER_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${TOKEN}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`scanner ${method} ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export interface ScannerStatus {
  ok: boolean;
  network: string;
  latestHeight: number;
  syncedHeight: number;
  accounts: number;
  mode: string; // "chain" | "demo"
  mempoolLag?: number;
}

export const scanner = {
  status: () => call<ScannerStatus>("GET", "/v1/status").catch(() => null),
  importAccount: (ufvk: string, webhookUrl: string, accountId?: string) =>
    call<{ accountId: string; fingerprint: string; network: string }>(
      "POST",
      "/v1/accounts",
      { ufvk, webhookUrl, accountId },
    ),
  allocateAddress: (accountId: string, diversifierIndex: number) =>
    call<{ address: string; diversifierIndex: number }>(
      "POST",
      `/v1/accounts/${accountId}/addresses`,
      { diversifierIndex },
    ),
  // demo-mode only: fabricate a payment event for an invoice's address
  demoPay: (invoiceId: string, address: string, zats: number, partial = false) =>
    call<{ ok: boolean }>("POST", "/v1/demo/pay", { invoiceId, address, zats, partial }),
};

export function webhookUrl(): string {
  const base = process.env.WEB_BASE_URL ?? "http://localhost:3010";
  return `${base}/api/internal/scanner-events`;
}
