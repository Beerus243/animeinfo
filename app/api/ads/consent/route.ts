import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const status = payload?.status === "granted" ? "granted" : "denied";
  const cookieStore = await cookies();

  cookieStore.set("animeinfo-consent", status, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
  });

  return NextResponse.json({ ok: true, status });
}