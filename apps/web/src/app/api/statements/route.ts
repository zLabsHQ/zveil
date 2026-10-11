import { NextResponse } from "next/server";
import { z } from "zod";
import { db, workspace } from "@/lib/db";
import { disclosures } from "@zveil/db";
import { disclosureToken, id } from "@/lib/id";
import { dayBounds } from "@/lib/statement";

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Body = z.object({
  from: Day,
  to: Day,
  label: z.string().trim().min(1).max(80).default("Accountant"),
  days: z.number().int().min(1).max(365).default(30),
});

// Create an expiring, read-only income statement link for a date range.
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid statement request" }, { status: 400 });
  const { label, days } = parsed.data;
  const { from, to } = dayBounds(parsed.data.from, parsed.data.to);
  if (!(from <= to)) return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });

  const ws = await workspace();
  const now = Date.now();
  const token = disclosureToken();
  await db().insert(disclosures).values({
    id: id(),
    kind: "statement",
    workspaceId: ws.id,
    periodFrom: from,
    periodTo: to,
    token,
    label,
    expiresAt: now + days * 86_400_000,
    createdAt: now,
  });
  return NextResponse.json({ url: `/d/${token}` });
}
