import { importConfiguredAnimeFeeds } from "@/lib/animeFeedImport";
import { importConfiguredArticleSources } from "@/lib/articleImport";
import { connectToDatabase } from "@/lib/mongodb";
import { getRssTrendSnapshot, persistRssTrendSnapshot } from "@/lib/rssTrends";

async function run() {
  await connectToDatabase();

  const articleImport = await importConfiguredArticleSources();
  if (!articleImport.sources) {
    throw new Error("No RSS sources configured.");
  }

  const animeImport = await importConfiguredAnimeFeeds();
  const trendSnapshot = await getRssTrendSnapshot();
  if (trendSnapshot.liveItems.length || trendSnapshot.sourceRows.length || trendSnapshot.topicRows.length) {
    await persistRssTrendSnapshot(trendSnapshot);
  }

  console.log(JSON.stringify({
    imported: articleImport.imported,
    duplicates: articleImport.duplicates,
    enriched: articleImport.enriched,
    processedItems: articleImport.processedItems,
    failures: articleImport.failures,
    animeImported: animeImport.imported,
    animeUpdated: animeImport.updated,
    animeTotalItems: animeImport.totalItems,
    animeFailures: animeImport.failures,
    trendLiveItems: trendSnapshot.liveItems.length,
  }, null, 2));
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });