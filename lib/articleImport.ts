import { buildImportedArticleKey, ensureUniqueArticleSlug, type EditorialSection } from "@/lib/articleDrafts";
import { uploadRemoteImageToCloudinary } from "@/lib/cloudinary";
import { shouldImportRecommendationItem } from "@/lib/recommendationClassifier";
import { fetchRssFeed, getConfiguredRssSourceGroups } from "@/lib/rssParser";
import Article from "@/models/Article";
import Source from "@/models/Source";

function mergeTags(existingTags: unknown, defaultTags: string[] = []) {
  const sourceTags = Array.isArray(existingTags) ? existingTags.filter((tag): tag is string => typeof tag === "string") : [];
  return Array.from(new Set([...sourceTags, ...defaultTags]));
}

export async function importConfiguredArticleSources(kind?: EditorialSection) {
  const sources = getConfiguredRssSourceGroups().filter((source) => (kind ? source.kind === kind : true));

  let imported = 0;
  let duplicates = 0;
  let enriched = 0;
  let processedItems = 0;
  const failures: Array<{ source: string; error: string }> = [];

  for (const source of sources) {
    try {
      const items = await fetchRssFeed(source.feedUrl);

      await Source.updateOne(
        { feedUrl: source.feedUrl },
        {
          $set: {
            name: new URL(source.feedUrl).hostname,
            active: true,
            category: source.sourceCategory,
            mapping: {
              category: source.sourceCategory,
              defaultTags: source.defaultTags,
            },
          },
        },
        { upsert: true },
      );

      for (const item of items) {
        if (!item.originalUrl) {
          continue;
        }

        if (source.kind === "recommendation" && source.recommendationType && !shouldImportRecommendationItem(item, source.recommendationType)) {
          continue;
        }

        processedItems += 1;

        const importKey = buildImportedArticleKey(item.originalUrl, source.kind, source.recommendationType);

        const existingArticle = await Article.findOne({
          $or: [
            { importKey },
            {
              importKey: { $exists: false },
              originalUrl: item.originalUrl,
              section: source.kind,
              ...(source.recommendationType ? { recommendationType: source.recommendationType } : { recommendationType: { $exists: false } }),
            },
          ],
        })
          .select({ _id: 1, coverImage: 1, seo: 1, tags: 1, category: 1, importKey: 1 })
          .lean();

        if (existingArticle) {
          duplicates += 1;

          const nextTags = mergeTags(existingArticle.tags, source.defaultTags);
          const shouldEnrichMeta =
            existingArticle.category !== source.sourceCategory ||
            nextTags.length !== (Array.isArray(existingArticle.tags) ? existingArticle.tags.length : 0) ||
            existingArticle.importKey !== importKey;

          if (shouldEnrichMeta) {
            await Article.updateOne(
              { _id: existingArticle._id },
              {
                $set: {
                  importKey,
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
        const slug = await ensureUniqueArticleSlug(item.title);

        await Article.create({
          title: item.title,
          slug,
          originalTitle: item.title,
          originalUrl: item.originalUrl,
          importKey,
          excerpt: item.excerpt,
          content: item.content,
          coverImage: mirroredCoverImage,
          category: source.sourceCategory,
          tags: source.defaultTags,
          section: source.kind,
          recommendationType: source.recommendationType,
          sourceName: item.sourceName,
          status: "draft",
          publishedAt: item.publishedAt,
          seo: {
            metaTitle: item.title,
            metaDesc: item.excerpt,
            ogImage: mirroredCoverImage,
          },
        });

        imported += 1;
      }
    } catch (error) {
      failures.push({
        source: source.feedUrl,
        error: error instanceof Error ? error.message : "Unknown import error",
      });
    }
  }

  return {
    kind: kind || "all",
    sources: sources.length,
    imported,
    duplicates,
    enriched,
    processedItems,
    failures,
  };
}