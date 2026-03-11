import { importConfiguredAnimeFeeds } from "@/lib/animeFeedImport";
import { connectToDatabase } from "@/lib/mongodb";
import { uploadRemoteImageToCloudinary } from "@/lib/cloudinary";
import { fetchRssFeed, getConfiguredRssSourceGroups } from "@/lib/rssParser";
import { getRssTrendSnapshot, persistRssTrendSnapshot } from "@/lib/rssTrends";
import Article from "@/models/Article";

function mergeTags(existingTags: unknown, defaultTags: string[] = []) {
  const sourceTags = Array.isArray(existingTags) ? existingTags.filter((tag): tag is string => typeof tag === "string") : [];
  return Array.from(new Set([...sourceTags, ...defaultTags]));
}

async function run() {
  const sources = getConfiguredRssSourceGroups();
  if (!sources.length) {
    throw new Error("No RSS sources configured.");
  }

  await connectToDatabase();

  let imported = 0;
  let enriched = 0;

  for (const source of sources) {
    const items = await fetchRssFeed(source.feedUrl);
    for (const item of items) {
      if (!item.originalUrl) {
        continue;
      }

      const existingArticle = await Article.findOne({ originalUrl: item.originalUrl })
        .select({ _id: 1, coverImage: 1, seo: 1, tags: 1, section: 1, recommendationType: 1, category: 1 })
        .lean();

      if (existingArticle) {
        const nextTags = mergeTags(existingArticle.tags, source.defaultTags);
        const shouldEnrichMeta =
          existingArticle.section !== source.kind ||
          existingArticle.recommendationType !== source.recommendationType ||
          existingArticle.category !== source.sourceCategory ||
          nextTags.length !== (Array.isArray(existingArticle.tags) ? existingArticle.tags.length : 0);

        if (shouldEnrichMeta) {
          await Article.updateOne(
            { _id: existingArticle._id },
            {
              $set: {
                section: source.kind,
                recommendationType: source.recommendationType,
                category: existingArticle.category || source.sourceCategory,
                tags: nextTags,
              },
            },
          );
        }

        if (!existingArticle.coverImage && item.coverImage) {
          const mirroredCoverImage = await uploadRemoteImageToCloudinary(item.coverImage, item.slug);
          await Article.updateOne(
            { _id: existingArticle._id },
            {
              $set: {
                coverImage: mirroredCoverImage,
                "seo.ogImage": existingArticle.seo?.ogImage || mirroredCoverImage,
              },
            },
          );
          enriched += 1;
        }

        continue;
      }

      const mirroredCoverImage = await uploadRemoteImageToCloudinary(item.coverImage, item.slug);

      await Article.create({
        title: item.title,
        slug: item.slug,
        originalTitle: item.title,
        originalUrl: item.originalUrl,
        excerpt: item.excerpt,
        content: item.content,
        coverImage: mirroredCoverImage,
        category: source.sourceCategory,
        tags: source.defaultTags,
        section: source.kind,
        recommendationType: source.recommendationType,
        sourceName: item.sourceName,
        status: "draft",
        seo: {
          metaTitle: item.title,
          metaDesc: item.excerpt,
          ogImage: mirroredCoverImage,
        },
      });

      imported += 1;
    }
  }

  const animeImport = await importConfiguredAnimeFeeds();
  const trendSnapshot = await getRssTrendSnapshot();
  if (trendSnapshot.liveItems.length || trendSnapshot.sourceRows.length || trendSnapshot.topicRows.length) {
    await persistRssTrendSnapshot(trendSnapshot);
  }

  console.log(JSON.stringify({
    imported,
    enriched,
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