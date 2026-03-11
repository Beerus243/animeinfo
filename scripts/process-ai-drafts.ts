import fs from "node:fs";
import path from "node:path";

import { connectToDatabase } from "@/lib/mongodb";
import { processStoredArticleToFrenchFirst } from "@/lib/articleTranslation";
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

  const limitArg = Number(process.argv[2] || "0");
  const limit = Number.isFinite(limitArg) && limitArg > 0 ? Math.floor(limitArg) : undefined;

  await connectToDatabase();
  const drafts = await Article.find({ status: { $in: ["draft", "review"] } })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit ?? 0)
    .lean();

  let processed = 0;
  let failed = 0;

  for (const draft of drafts) {
    try {
      await processStoredArticleToFrenchFirst(draft);
      processed += 1;
      console.log(`OK ${draft._id.toString()} ${draft.title}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      await Article.updateOne(
        { _id: draft._id },
        {
          $set: {
            aiStatus: "failed",
            aiError: message,
            aiProcessedAt: new Date(),
          },
        },
      );
      console.log(`FAIL ${draft._id.toString()} ${draft.title} ${message}`);
    }
  }

  console.log(JSON.stringify({ selected: drafts.length, processed, failed }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});