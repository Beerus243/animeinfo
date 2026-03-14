import { NextResponse, type NextRequest } from "next/server";

import { adminSessionCookieName, legacyAdminSessionCookieName, verifyAdminSession } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const sessionValue = request.cookies.get(adminSessionCookieName)?.value || request.cookies.get(legacyAdminSessionCookieName)?.value;
  const authenticated = await verifyAdminSession(sessionValue);

  return NextResponse.json({ authenticated });
}