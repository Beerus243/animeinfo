import type { Metadata } from "next";

import ArticleCard from "@/app/components/ArticleCard";
import { resolveArticleLocalization } from "@/lib/articleLocalization";
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

  const localizedAnimeRecommendations = animeRecommendations.map((article) => ({
    article,
    localized: resolveArticleLocalization(article, locale),
  }));
  const localizedMangaRecommendations = mangaRecommendations.map((article) => ({
    article,
    localized: resolveArticleLocalization(article, locale),
  }));

  const seenRecommendationKeys = new Set(
    localizedAnimeRecommendations.map(({ article, localized }) => (article.originalUrl || slugify(localized.title || article.title || "")).toLowerCase()),
  );

  const dedupedMangaRecommendations = localizedMangaRecommendations.filter(({ article, localized }) => {
    const key = (article.originalUrl || slugify(localized.title || article.title || "")).toLowerCase();
    return !seenRecommendationKeys.has(key);
  });

  const jsonLd = buildCollectionJsonLd({
    title: messages.recommendations.title,
    description: messages.recommendations.description,
    path: "/recommendations",
    itemPaths: [...animeRecommendations, ...dedupedMangaRecommendations.map(({ article }) => article)].map((article) => `/article/${article.slug}`),
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
              localizedAnimeRecommendations.map(({ article, localized }) => (
                <ArticleCard
                  key={article._id.toString()}
                  article={{
                    title: localized.title || article.title,
                    slug: localized.slug || article.slug,
                    excerpt: localized.excerpt ?? undefined,
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
              dedupedMangaRecommendations.map(({ article, localized }) => (
                <ArticleCard
                  key={article._id.toString()}
                  article={{
                    title: localized.title || article.title,
                    slug: localized.slug || article.slug,
                    excerpt: localized.excerpt ?? undefined,
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