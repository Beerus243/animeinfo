import { buildImportedArticleKey, ensureUniqueArticleSlug, type EditorialSection } from "@/lib/articleDrafts";
import { buildFrenchFirstLocalizations, isFrenchAiPipelineConfigured } from "@/lib/articleTranslation";
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
  let aiProcessed = 0;
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
        let rootTitle = item.title;
        let rootSlug = slug;
        let rootExcerpt = item.excerpt;
        let rootContent = item.content;
        let rootSeo = {
          metaTitle: item.title,
          metaDesc: item.excerpt,
          ogImage: mirroredCoverImage,
        };
        let aiStatus: "pending" | "done" | "failed" = isFrenchAiPipelineConfigured() ? "done" : "pending";
        let aiError = "";
        let aiRewritten = false;
        let localizations:
          | {
              fr: {
                slug?: string;
                title?: string;
                excerpt?: string;
                content?: string;
                seo?: {
                  metaTitle?: string;
                  metaDesc?: string;
                  ogImage?: string;
                };
              };
              en: {
                slug?: string;
                title?: string;
                excerpt?: string;
                content?: string;
                seo?: {
                  metaTitle?: string;
                  metaDesc?: string;
                  ogImage?: string;
                };
              };
            }
          | undefined;

        if (isFrenchAiPipelineConfigured()) {
          try {
            const processed = await buildFrenchFirstLocalizations({
              sourceLocale: "en",
              fields: {
                title: item.title,
                excerpt: item.excerpt,
                content: item.content,
                seo: {
                  metaTitle: item.title,
                  metaDesc: item.excerpt,
                  ogImage: mirroredCoverImage,
                },
              },
              existingSlugs: [slug],
            });

            rootTitle = processed.root.title || rootTitle;
            rootSlug = processed.root.slug || rootSlug;
            rootExcerpt = processed.root.excerpt || rootExcerpt;
            rootContent = processed.root.content || rootContent;
            rootSeo = {
              metaTitle: processed.root.seo.metaTitle || rootSeo.metaTitle,
              metaDesc: processed.root.seo.metaDesc || rootSeo.metaDesc,
              ogImage: processed.root.seo.ogImage || rootSeo.ogImage,
            };
            localizations = processed.localizations;
            aiRewritten = processed.aiRewritten;
            aiProcessed += 1;
          } catch (error) {
            aiStatus = "failed";
            aiError = error instanceof Error ? error.message : "AI processing failed for imported item";
            failures.push({
              source: `${source.feedUrl}#${item.originalUrl}`,
              error: aiError,
            });
          }
        }

        if (!localizations) {
          localizations = {
            fr: {
              slug: rootSlug,
              title: rootTitle,
              excerpt: rootExcerpt,
              content: rootContent,
              seo: {
                metaTitle: rootSeo.metaTitle,
                metaDesc: rootSeo.metaDesc,
                ogImage: rootSeo.ogImage,
              },
            },
            en: {
              slug: "",
              title: "",
              excerpt: "",
              content: "",
              seo: {
                metaTitle: "",
                metaDesc: "",
                ogImage: rootSeo.ogImage,
              },
            },
          };
        }

        await Article.create({
          title: rootTitle,
          slug: rootSlug,
          originalTitle: item.title,
          originalUrl: item.originalUrl,
          importKey,
          excerpt: rootExcerpt,
          content: rootContent,
          coverImage: mirroredCoverImage,
          category: source.sourceCategory,
          tags: source.defaultTags,
          section: source.kind,
          recommendationType: source.recommendationType,
          aiStatus,
          aiError,
          aiProcessedAt: aiStatus === "done" ? new Date() : undefined,
          aiRewritten,
          sourceName: item.sourceName,
          status: "draft",
          publishedAt: item.publishedAt,
          seo: rootSeo,
          localizations,
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
    aiProcessed,
    processedItems,
    failures,
  };
}