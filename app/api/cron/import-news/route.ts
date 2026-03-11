import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized, isCronSecretAuthorized } from "@/lib/adminAuth";
import { uploadRemoteImageToCloudinary } from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/mongodb";
import { fetchRssFeed, getConfiguredRssSources } from "@/lib/rssParser";
import Article from "@/models/Article";
import Source from "@/models/Source";

export async function GET(request: NextRequest) {
  const isAuthorized = (await isAdminRequestAuthorized(request)) || isCronSecretAuthorized(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = getConfiguredRssSources();
  if (!sources.length) {
    return NextResponse.json({ error: "No RSS sources configured." }, { status: 400 });
  }

  await connectToDatabase();

  let imported = 0;
  let duplicates = 0;
  let enriched = 0;
  const failures: Array<{ source: string; error: string }> = [];

  for (const sourceUrl of sources) {
    try {
      const items = await fetchRssFeed(sourceUrl);

      await Source.updateOne(
        { feedUrl: sourceUrl },
        { $set: { name: new URL(sourceUrl).hostname, active: true } },
        { upsert: true },
      );

      for (const item of items) {
        if (!item.originalUrl) {
          continue;
        }

        const existingArticle = await Article.findOne({ originalUrl: item.originalUrl })
          .select({ _id: 1, coverImage: 1, seo: 1, status: 1 })
          .lean();

        if (existingArticle) {
          duplicates += 1;

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
        source: sourceUrl,
        error: error instanceof Error ? error.message : "Unknown import error",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    sources: sources.length,
    imported,
    duplicates,
    enriched,
    failures,
  });
}