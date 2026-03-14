import { NextRequest, NextResponse } from "next/server";

import { adminSessionCookieName, createAdminSession, legacyAdminSessionCookieName, verifyAdminCredentials } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const email = String(payload?.email || "").trim();
  const password = String(payload?.password || "");

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const session = await createAdminSession(email);
  response.cookies.set(adminSessionCookieName, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set(legacyAdminSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}