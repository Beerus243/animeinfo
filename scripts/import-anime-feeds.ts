import { cleanupLegacyAiringAnime, importAnimeFeed, importConfiguredAnimeFeeds } from "@/lib/animeFeedImport";
import { getCurrentSeasonLabel } from "@/lib/animeSeason";
import { connectToDatabase } from "@/lib/mongodb";

async function run() {
  await connectToDatabase();

  if (process.argv.includes("--icotaku-refresh")) {
    const removed = await cleanupLegacyAiringAnime();
    const result = await importAnimeFeed({
      feedUrl: "icotaku://airing",
      status: "airing",
      sourceName: "anime-airing-feed",
      currentSeasonLabel: getCurrentSeasonLabel(),
    });

    console.log(JSON.stringify({ removed, ...result }, null, 2));
    return;
  }

  const animeImport = await importConfiguredAnimeFeeds();
  console.log(JSON.stringify(animeImport, null, 2));
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });