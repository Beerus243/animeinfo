import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { importConfiguredAnimeFeeds } from "@/lib/animeFeedImport";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const { results, failures, totalItems, imported, updated } = await importConfiguredAnimeFeeds();

  return NextResponse.json({
    ok: true,
    feeds: results,
    imported,
    updated,
    totalItems,
    failures,
    message: totalItems === 0 ? "Feeds responded but returned no anime items in this environment." : undefined,
  });
}