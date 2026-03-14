import fs from "node:fs";
import path from "node:path";

import { importConfiguredArticleSources, publishEligibleImportedRecommendations } from "@/lib/articleImport";
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

async function main() {
  loadEnvFile(".env.local");
  await connectToDatabase();

  console.log("[1/2] Reimport des recommandations pour enrichir les visuels...");
  const recommendations = await importConfiguredArticleSources("recommendation");

  console.log("[2/2] Publication automatique des recommandations eligibles...");
  const autoPublished = await publishEligibleImportedRecommendations();

  console.log(
    JSON.stringify(
      {
        imported: recommendations.imported,
        duplicates: recommendations.duplicates,
        enriched: recommendations.enriched,
        processedItems: recommendations.processedItems,
        failures: recommendations.failures,
        autoPublished,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});