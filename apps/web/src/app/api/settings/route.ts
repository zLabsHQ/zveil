import { NextResponse } from "next/server";
import { z } from "zod";
import { db, workspace } from "@/lib/db";
import { workspaces } from "@zveil/db";
import { eq } from "drizzle-orm";

const Body = z.object({ businessName: z.string().min(1).max(120) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  db()
    .update(workspaces)
    .set({ businessName: parsed.data.businessName })
    .where(eq(workspaces.id, workspace().id))
    .run();
  return NextResponse.json({ ok: true });
}
