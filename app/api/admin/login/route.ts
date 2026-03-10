import { NextRequest, NextResponse } from "next/server";

import { adminSessionCookieName, createAdminSession, verifyAdminCredentials } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const email = String(payload?.email || "").trim();
  const password = String(payload?.password || "");

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieName, await createAdminSession(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}