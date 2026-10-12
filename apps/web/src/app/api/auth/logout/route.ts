import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { WS_COOKIE } from "@/lib/workspace-id";

// "Sign out" = detach this browser from the workspace. The cookie is the only
// binding — data, passkeys and the recovery code all stay server-side.
export async function POST() {
  const jar = await cookies();
  jar.delete(WS_COOKIE);
  return NextResponse.json({ ok: true });
}
