import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

export async function GET(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const drafts = await Article.find({ status: { $in: ["draft", "review"] } })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ ok: true, drafts });
}