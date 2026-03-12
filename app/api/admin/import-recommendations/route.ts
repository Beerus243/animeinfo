import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { importConfiguredArticleSources, publishImportedRecommendations } from "@/lib/articleImport";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const result = await importConfiguredArticleSources("recommendation");
  const published = await publishImportedRecommendations();

  return NextResponse.json({
    ok: true,
    ...result,
    published,
  });
}