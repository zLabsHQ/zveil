import { NextResponse } from "next/server";
import { z } from "zod";
import { db, workspace } from "@/lib/db";
import { scanner, webhookUrl } from "@/lib/scanner";
import { viewingKeys } from "@zveil/db";
import { id } from "@/lib/id";
import { checkUfvk, ufvkErrorMessage } from "@/lib/ufvk";

const Body = z.object({ ufvk: z.string().min(32).max(4096) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid viewing key" }, { status: 400 });
  const network = process.env.ZCASH_NETWORK ?? "testnet";
  const check = checkUfvk(parsed.data.ufvk, network);
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: 400 });

  let acct;
  try {
    acct = await scanner.importAccount(parsed.data.ufvk, webhookUrl());
  } catch (e) {
    // Demo fallback: scanner offline → create a local mock account so the
    // full product flow still runs end-to-end without infrastructure.
    if (process.env.DEMO_MODE === "1") {
      const { createHash } = await import("node:crypto");
      const fp = createHash("sha256").update(parsed.data.ufvk).digest("hex").slice(0, 16);
      acct = { accountId: `demo-${fp}`, fingerprint: fp, network: "regtest" };
    } else {
      const raw = e instanceof Error ? e.message : "unreachable";
      const is400 = raw.includes("→ 400");
      return NextResponse.json(
        { error: is400 ? ufvkErrorMessage(raw, network) : `Could not connect scanner: ${raw}` },
        { status: is400 ? 400 : 502 },
      );
    }
  }

  const ws = await workspace();
  await db()
    .insert(viewingKeys)
    .values({
      id: id(),
      workspaceId: ws.id,
      fingerprint: acct.fingerprint,
      network: acct.network,
      scannerAccountId: acct.accountId,
      keyRef: "env:UFVK_0", // sealed — raw UFVK never stored in app DB
      createdAt: Date.now(),
    });

  return NextResponse.json({
    ok: true,
    fingerprint: acct.fingerprint,
    network: acct.network,
  });
}
