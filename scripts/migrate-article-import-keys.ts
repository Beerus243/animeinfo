import mongoose from "mongoose";

type ArticleImportIdentity = {
  _id: mongoose.Types.ObjectId;
  originalUrl?: string;
  section?: string;
  recommendationType?: string;
  importKey?: string;
};

function buildKey(doc: {
  originalUrl?: string;
  section?: string;
  recommendationType?: string;
}) {
  return [doc.section || "news", doc.recommendationType || "general", String(doc.originalUrl || "").trim()].join("::");
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI.");
  }

  await mongoose.connect(uri);

  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection is not initialized.");
  }

  const collection = mongoose.connection.db.collection("articles");
  const docs = await collection.find<ArticleImportIdentity>(
    { originalUrl: { $exists: true, $ne: "" } },
    { projection: { _id: 1, originalUrl: 1, section: 1, recommendationType: 1, importKey: 1 } },
  ).toArray();

  let updated = 0;
  for (const doc of docs) {
    const importKey = buildKey(doc);
    if (doc.importKey !== importKey) {
      await collection.updateOne({ _id: doc._id }, { $set: { importKey } });
      updated += 1;
    }
  }

  const indexes = await collection.indexes();
  if (indexes.some((index) => index.name === "originalUrl_1")) {
    await collection.dropIndex("originalUrl_1");
  }
  if (indexes.some((index) => index.name === "importKey_1")) {
    await collection.dropIndex("importKey_1");
  }

  await collection.createIndex({ importKey: 1 }, { unique: true, sparse: true, background: true, name: "importKey_1" });

  console.log(JSON.stringify({ updated, total: docs.length, migratedIndexes: true }, null, 2));
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });