import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized, isCronSecretAuthorized } from "@/lib/adminAuth";
import { importConfiguredArticleSources } from "@/lib/articleImport";
import { getConfiguredAnimeFeeds, importSelectedAnimeFeeds, refreshIcotakuAiringFeed } from "@/lib/animeFeedImport";
import { connectToDatabase } from "@/lib/mongodb";
import { hasAnyReleaseDeliveryChannel, sendDueReleaseAlerts } from "@/lib/releaseAlerts";
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

  const icotakuRefresh = await refreshIcotakuAiringFeed();
  const secondaryAnimeImport = await importSelectedAnimeFeeds(
    getConfiguredAnimeFeeds().filter((feed) => feed.feedUrl !== "icotaku://airing"),
  );

  for (const failure of secondaryAnimeImport.failures) {
    failures.push({ source: failure.feedUrl, error: failure.error });
  }

  let trendSnapshotStored = false;
  let releaseAlerts: Awaited<ReturnType<typeof sendDueReleaseAlerts>> | null = null;
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

  if (hasAnyReleaseDeliveryChannel()) {
    try {
      releaseAlerts = await sendDueReleaseAlerts();
    } catch (error) {
      failures.push({
        source: "release-alerts",
        error: error instanceof Error ? error.message : "Unable to send release alerts",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    sources: articleImport.sources,
    imported: articleImport.imported,
    duplicates: articleImport.duplicates,
    enriched: articleImport.enriched,
    aiProcessed: articleImport.aiProcessed,
    animeImported: icotakuRefresh.imported + secondaryAnimeImport.imported,
    animeUpdated: icotakuRefresh.updated + secondaryAnimeImport.updated,
    animeTotalItems: icotakuRefresh.totalItems + secondaryAnimeImport.totalItems,
    animeIcotakuRemoved: icotakuRefresh.removed,
    trendSnapshotStored,
    releaseAlerts,
    failures,
  });
}