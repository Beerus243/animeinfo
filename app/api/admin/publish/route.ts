import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  if (!payload?.id) {
    return NextResponse.json({ error: "Missing article id." }, { status: 400 });
  }

  await connectToDatabase();

  const article = await Article.findByIdAndUpdate(
    payload.id,
    {
      $set: {
        status: "published",
        publishedAt: new Date(),
      },
    },
    { new: true },
  ).lean();

  return NextResponse.json({ ok: true, article });
}