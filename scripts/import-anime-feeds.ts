import fs from "node:fs";
import path from "node:path";

import { cleanupLegacyAiringAnime, cleanupLegacyUpcomingAnime, importAnimeFeed, importConfiguredAnimeFeeds } from "@/lib/animeFeedImport";
import { getCurrentSeasonLabel } from "@/lib/animeSeason";
import { connectToDatabase } from "@/lib/mongodb";

function loadEnvFile(fileName: string) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [rawKey, ...rawValueParts] = trimmed.split("=");
    const key = rawKey.trim();
    let value = rawValueParts.join("=").trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function run() {
  loadEnvFile(".env.local");
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

  if (process.argv.includes("--cleanup-legacy-upcoming")) {
    const removed = await cleanupLegacyUpcomingAnime();
    console.log(JSON.stringify({ removed }, null, 2));
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