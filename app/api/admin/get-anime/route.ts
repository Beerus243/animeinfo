import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { connectToDatabase } from "@/lib/mongodb";
import Anime from "@/models/Anime";

export async function GET(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing anime id." }, { status: 400 });
  }

  await connectToDatabase();
  const anime = await Anime.findById(id).lean();

  if (!anime) {
    return NextResponse.json({ error: "Anime not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, anime });
}