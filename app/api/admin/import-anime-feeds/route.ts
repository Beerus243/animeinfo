import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { importConfiguredAnimeFeeds, refreshIcotakuAiringFeed } from "@/lib/animeFeedImport";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const payload = await request.json().catch(() => null);
  if (payload?.mode === "icotaku-refresh") {
    const result = await refreshIcotakuAiringFeed();

    return NextResponse.json({
      ok: true,
      mode: "icotaku-refresh",
      imported: result.imported,
      updated: result.updated,
      totalItems: result.totalItems,
      removed: result.removed,
      failures: [],
      message: result.totalItems === 0 ? "Icotaku responded but returned no airing anime items in this environment." : undefined,
    });
  }

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