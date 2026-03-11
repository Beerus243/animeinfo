import fs from "node:fs";
import path from "node:path";

import { importConfiguredArticleSources } from "@/lib/articleImport";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

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

  console.log("[1/4] Suppression des brouillons et reviews...");

  const deleteResult = await Article.deleteMany({ status: { $in: ["draft", "review"] } });
  console.log(`[1/4] ${deleteResult.deletedCount || 0} brouillon(s) supprime(s).`);

  console.log("[2/4] Nettoyage des articles publies (reinit AI + suppression localizations.en)...");
  const cleanupResult = await Article.updateMany(
    { status: "published" },
    {
      $unset: {
        aiError: 1,
        aiProcessedAt: 1,
        "localizations.en": 1,
      },
      $set: {
        aiStatus: "pending",
        aiRewritten: false,
      },
    },
  );
  console.log(`[2/4] ${cleanupResult.modifiedCount || 0} article(s) publie(s) nettoye(s).`);

  console.log("[3/4] Import des news FR...");
  const news = await importConfiguredArticleSources("news");
  console.log(`[3/4] News importees: ${news.imported}, doublons: ${news.duplicates}, erreurs: ${news.failures.length}.`);

  console.log("[4/4] Import des recommandations FR...");
  const recommendations = await importConfiguredArticleSources("recommendation");
  console.log(`[4/4] Recommandations importees: ${recommendations.imported}, doublons: ${recommendations.duplicates}, erreurs: ${recommendations.failures.length}.`);

  console.log(
    JSON.stringify({
      deletedDrafts: deleteResult.deletedCount || 0,
      resetPublished: cleanupResult.modifiedCount || 0,
      news,
      recommendations,
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});