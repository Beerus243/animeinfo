import type { Metadata } from "next";

import ArticleCard from "@/app/components/ArticleCard";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { buildCollectionJsonLd, buildMetadata } from "@/lib/seo";
import { slugify } from "@/lib/slugify";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return buildMetadata({
    title: messages.recommendations.title,
    description: messages.recommendations.description,
    path: "/recommendations",
  });
}

export default async function RecommendationsPage() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  await connectToDatabase();

  const [animeRecommendations, mangaRecommendations] = await Promise.all([
    Article.find({ status: "published", section: "recommendation", recommendationType: "anime" })
      .sort({ publishedAt: -1, updatedAt: -1 })
      .limit(12)
      .lean(),
    Article.find({ status: "published", section: "recommendation", recommendationType: "manga" })
      .sort({ publishedAt: -1, updatedAt: -1 })
      .limit(12)
      .lean(),
  ]);

  const seenRecommendationKeys = new Set(
    animeRecommendations.map((article) => (article.originalUrl || slugify(article.title || "")).toLowerCase()),
  );

  const dedupedMangaRecommendations = mangaRecommendations.filter((article) => {
    const key = (article.originalUrl || slugify(article.title || "")).toLowerCase();
    return !seenRecommendationKeys.has(key);
  });

  const jsonLd = buildCollectionJsonLd({
    title: messages.recommendations.title,
    description: messages.recommendations.description,
    path: "/recommendations",
    itemPaths: [...animeRecommendations, ...dedupedMangaRecommendations].map((article) => `/article/${article.slug}`),
  });

  return (
    <div className="shell-container py-6 md:py-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="panel px-5 py-6 md:px-8 md:py-8">
        <span className="eyebrow">{messages.recommendations.eyebrow}</span>
        <h1 className="mt-4 font-display text-3xl font-semibold md:text-5xl">{messages.recommendations.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted md:text-base md:leading-7">{messages.recommendations.description}</p>
      </section>

      <section className="mt-6 space-y-6 md:mt-8 md:space-y-8">
        <div>
          <h2 className="font-display text-2xl font-semibold md:text-[1.7rem]">{messages.recommendations.animeTitle}</h2>
          <div className="grid-auto-fit mt-5 md:mt-6">
            {animeRecommendations.length ? (
              animeRecommendations.map((article) => (
                <ArticleCard
                  key={article._id.toString()}
                  article={{
                    title: article.title,
                    slug: article.slug,
                    excerpt: article.excerpt ?? undefined,
                    category: article.category ?? undefined,
                    coverImage: article.coverImage ?? undefined,
                    publishedAt: article.publishedAt ?? undefined,
                  }}
                />
              ))
            ) : (
              <div className="panel p-5 text-sm text-muted">{messages.recommendations.emptyAnime}</div>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold md:text-[1.7rem]">{messages.recommendations.mangaTitle}</h2>
          <div className="grid-auto-fit mt-5 md:mt-6">
            {dedupedMangaRecommendations.length ? (
              dedupedMangaRecommendations.map((article) => (
                <ArticleCard
                  key={article._id.toString()}
                  article={{
                    title: article.title,
                    slug: article.slug,
                    excerpt: article.excerpt ?? undefined,
                    category: article.category ?? undefined,
                    coverImage: article.coverImage ?? undefined,
                    publishedAt: article.publishedAt ?? undefined,
                  }}
                />
              ))
            ) : (
              <div className="panel p-5 text-sm text-muted">{messages.recommendations.emptyManga}</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}