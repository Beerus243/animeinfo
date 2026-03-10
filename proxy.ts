import { NextResponse, type NextRequest } from "next/server";

import { adminSessionCookieName, verifyAdminSession } from "@/lib/adminAuth";

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const sessionValue = request.cookies.get(adminSessionCookieName)?.value;
  if (await verifyAdminSession(sessionValue)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};