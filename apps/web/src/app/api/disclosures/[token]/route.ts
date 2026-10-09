import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { disclosures } from "@zveil/db";
import { eq } from "drizzle-orm";

type Ctx = { params: Promise<{ token: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const [d] = await db().select().from(disclosures).where(eq(disclosures.token, token)).limit(1);
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db().update(disclosures).set({ revokedAt: Date.now() }).where(eq(disclosures.token, token));
  return NextResponse.json({ ok: true });
}
