import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized, isCronSecretAuthorized } from "@/lib/adminAuth";
import { importConfiguredArticleSources } from "@/lib/articleImport";
import { importConfiguredAnimeFeeds } from "@/lib/animeFeedImport";
import { connectToDatabase } from "@/lib/mongodb";
import { getRssTrendSnapshot, persistRssTrendSnapshot } from "@/lib/rssTrends";

export async function GET(request: NextRequest) {
  const isAuthorized = (await isAdminRequestAuthorized(request)) || isCronSecretAuthorized(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articleImport = await importConfiguredArticleSources();
  if (!articleImport.sources) {
    return NextResponse.json({ error: "No RSS sources configured." }, { status: 400 });
  }

  await connectToDatabase();
  const failures = [...articleImport.failures];

  const animeImport = await importConfiguredAnimeFeeds();
  for (const failure of animeImport.failures) {
    failures.push({ source: failure.feedUrl, error: failure.error });
  }

  let trendSnapshotStored = false;
  try {
    const trendSnapshot = await getRssTrendSnapshot();
    if (trendSnapshot.liveItems.length || trendSnapshot.sourceRows.length || trendSnapshot.topicRows.length) {
      await persistRssTrendSnapshot(trendSnapshot);
      trendSnapshotStored = true;
    }
  } catch (error) {
    failures.push({
      source: "rss-trends",
      error: error instanceof Error ? error.message : "Unable to persist trend snapshot",
    });
  }

  return NextResponse.json({
    ok: true,
    sources: articleImport.sources,
    imported: articleImport.imported,
    duplicates: articleImport.duplicates,
    enriched: articleImport.enriched,
    animeImported: animeImport.imported,
    animeUpdated: animeImport.updated,
    animeTotalItems: animeImport.totalItems,
    trendSnapshotStored,
    failures,
  });
}