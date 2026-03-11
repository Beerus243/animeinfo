import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized, isCronSecretAuthorized } from "@/lib/adminAuth";
import { buildImportedArticleKey, ensureUniqueArticleSlug } from "@/lib/articleDrafts";
import { importConfiguredAnimeFeeds } from "@/lib/animeFeedImport";
import { uploadRemoteImageToCloudinary } from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/mongodb";
import { shouldImportRecommendationItem } from "@/lib/recommendationClassifier";
import { fetchRssFeed, getConfiguredRssSourceGroups } from "@/lib/rssParser";
import { getRssTrendSnapshot, persistRssTrendSnapshot } from "@/lib/rssTrends";
import Article from "@/models/Article";
import Source from "@/models/Source";

function mergeTags(existingTags: unknown, defaultTags: string[] = []) {
  const sourceTags = Array.isArray(existingTags) ? existingTags.filter((tag): tag is string => typeof tag === "string") : [];
  return Array.from(new Set([...sourceTags, ...defaultTags]));
}

export async function GET(request: NextRequest) {
  const isAuthorized = (await isAdminRequestAuthorized(request)) || isCronSecretAuthorized(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = getConfiguredRssSourceGroups();
  if (!sources.length) {
    return NextResponse.json({ error: "No RSS sources configured." }, { status: 400 });
  }

  await connectToDatabase();

  let imported = 0;
  let duplicates = 0;
  let enriched = 0;
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
          .select({ _id: 1, coverImage: 1, seo: 1, tags: 1, section: 1, recommendationType: 1, category: 1, importKey: 1 })
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

  const animeImport = await importConfiguredAnimeFeeds();
  for (const failure of animeImport.failures) {
    failures.push({ source: failure.feedUrl, error: failure.error });
  }

  let trendSnapshotStored = false;
  try {
    const trendSnapshot = await getRssTrendSnapshot();
    if (trendSnapshot.liveItems.length || trendSnapshot.sourceRows.length || trendSnapshot.topicRows.length) {
      await persistRssTrendSnapshot(trendSnapshot);
      trendSnapshotStored = true;
    }
  } catch (error) {
    failures.push({
      source: "rss-trends",
      error: error instanceof Error ? error.message : "Unable to persist trend snapshot",
    });
  }

  return NextResponse.json({
    ok: true,
    sources: sources.length,
    imported,
    duplicates,
    enriched,
    animeImported: animeImport.imported,
    animeUpdated: animeImport.updated,
    animeTotalItems: animeImport.totalItems,
    trendSnapshotStored,
    failures,
  });
}