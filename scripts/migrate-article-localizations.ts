import mongoose from "mongoose";

type ArticleLocalizationDoc = {
  _id: mongoose.Types.ObjectId;
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  seo?: {
    metaTitle?: string | null;
    metaDesc?: string | null;
    ogImage?: string | null;
  } | null;
  localizations?: {
    fr?: {
      title?: string | null;
      excerpt?: string | null;
      content?: string | null;
      seo?: {
        metaTitle?: string | null;
        metaDesc?: string | null;
        ogImage?: string | null;
      } | null;
    } | null;
    en?: {
      title?: string | null;
      excerpt?: string | null;
      content?: string | null;
      seo?: {
        metaTitle?: string | null;
        metaDesc?: string | null;
        ogImage?: string | null;
      } | null;
    } | null;
  } | null;
};

function normalizeText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "";
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
  const docs = await collection.find<ArticleLocalizationDoc>({}, {
    projection: {
      _id: 1,
      title: 1,
      excerpt: 1,
      content: 1,
      seo: 1,
      localizations: 1,
    },
  }).toArray();

  let updated = 0;
  for (const doc of docs) {
    const nextLocalizations = {
      fr: {
        title: normalizeText(doc.localizations?.fr?.title) || normalizeText(doc.title),
        excerpt: normalizeText(doc.localizations?.fr?.excerpt) || normalizeText(doc.excerpt),
        content: normalizeText(doc.localizations?.fr?.content) || normalizeText(doc.content),
        seo: {
          metaTitle: normalizeText(doc.localizations?.fr?.seo?.metaTitle) || normalizeText(doc.seo?.metaTitle),
          metaDesc: normalizeText(doc.localizations?.fr?.seo?.metaDesc) || normalizeText(doc.seo?.metaDesc),
          ogImage: normalizeText(doc.localizations?.fr?.seo?.ogImage) || normalizeText(doc.seo?.ogImage),
        },
      },
      en: {
        title: normalizeText(doc.localizations?.en?.title),
        excerpt: normalizeText(doc.localizations?.en?.excerpt),
        content: normalizeText(doc.localizations?.en?.content),
        seo: {
          metaTitle: normalizeText(doc.localizations?.en?.seo?.metaTitle),
          metaDesc: normalizeText(doc.localizations?.en?.seo?.metaDesc),
          ogImage: normalizeText(doc.localizations?.en?.seo?.ogImage) || normalizeText(doc.seo?.ogImage),
        },
      },
    };

    const currentSerialized = JSON.stringify(doc.localizations || {});
    const nextSerialized = JSON.stringify(nextLocalizations);

    if (currentSerialized !== nextSerialized) {
      await collection.updateOne({ _id: doc._id }, { $set: { localizations: nextLocalizations } });
      updated += 1;
    }
  }

  console.log(JSON.stringify({ updated, total: docs.length }, null, 2));
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