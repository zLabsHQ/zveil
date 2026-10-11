import { NextResponse, type NextRequest } from "next/server";
import { WS_COOKIE, WS_HEADER, isWorkspaceId } from "@/lib/workspace-id";

// Every visitor gets an isolated sandbox workspace. The id travels as an
// httpOnly cookie; on the first request we also forward it as a request header
// so server components can read it before the browser has stored the cookie.
export function proxy(request: NextRequest) {
  const existing = request.cookies.get(WS_COOKIE)?.value;
  if (existing && isWorkspaceId(existing)) return NextResponse.next();

  const id = `ws_${crypto.randomUUID().replace(/-/g, "")}`;
  const headers = new Headers(request.headers);
  headers.set(WS_HEADER, id);
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set({
    name: WS_COOKIE,
    value: id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}

export const config = {
  matcher: ["/app/:path*", "/onboarding", "/api/:path*"],
};
