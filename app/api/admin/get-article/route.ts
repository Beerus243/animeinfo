import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

export async function GET(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing article id." }, { status: 400 });
  }

  await connectToDatabase();
  const article = await Article.findById(id).lean();

  if (!article) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, article });
}