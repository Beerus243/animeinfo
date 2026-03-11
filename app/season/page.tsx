import type { Metadata } from "next";
import Link from "next/link";

import ArticleCard from "@/app/components/ArticleCard";
import { resolveArticleLocalization } from "@/lib/articleLocalization";
import { ensureArticlesLocalization } from "@/lib/articleTranslation";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { buildCollectionJsonLd, buildMetadata } from "@/lib/seo";
import Anime from "@/models/Anime";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type SeasonRow = {
  _id: string;
  animeCount: number;
  animeTitles: string[];
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return buildMetadata({
    title: messages.season.title,
    description: messages.season.description,
    path: "/season",
  });
}

export default async function SeasonPage() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  await connectToDatabase();

  const [seasonRows, recentArticles] = await Promise.all([
    Anime.aggregate<SeasonRow>([
      { $match: { seasons: { $exists: true, $ne: [] } } },
      { $unwind: "$seasons" },
      { $match: { seasons: { $type: "string", $ne: "" } } },
      {
        $group: {
          _id: "$seasons",
          animeCount: { $sum: 1 },
          animeTitles: { $addToSet: "$title" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 8 },
    ]),
    Article.find({ status: "published" })
      .sort({ publishedAt: -1, updatedAt: -1 })
      .limit(6)
      .lean(),
  ]);
  const localizedRecentArticles = await ensureArticlesLocalization(recentArticles, locale);

  const jsonLd = buildCollectionJsonLd({
    title: messages.season.title,
    description: messages.season.description,
    path: "/season",
    itemPaths: localizedRecentArticles.map((article) => `/article/${resolveArticleLocalization(article, locale).slug || article.slug}`),
  });

  return (
    <div className="shell-container py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="panel px-6 py-8 md:px-10 md:py-12">
        <span className="eyebrow">{messages.season.eyebrow}</span>
        <h1 className="mt-5 font-display text-4xl font-semibold md:text-6xl">{messages.season.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{messages.season.description}</p>
      </section>

      <div className="grid-auto-fit mt-8">
        {seasonRows.length ? (
          seasonRows.map((season) => (
            <section key={season._id} className="panel p-6">
              <p className="text-sm uppercase tracking-[0.16em] text-muted">{messages.season.eyebrow}</p>
              <h2 className="mt-4 font-display text-3xl font-semibold">{season._id}</h2>
              <p className="mt-3 text-sm text-muted">{season.animeCount} {messages.season.animeCount}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {season.animeTitles.slice(0, 6).map((title) => (
                  <span key={title} className="rounded-full bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
                    {title}
                  </span>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="panel p-6 text-muted">{messages.season.empty}</div>
        )}
      </div>

      <section className="mt-8 panel px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{messages.season.latestCoverage}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">{messages.season.latestAnime}</h2>
          </div>
          <Link className="button-secondary" href="/categories">
            {messages.season.explore}
          </Link>
        </div>
        <div className="grid-auto-fit mt-6">
          {localizedRecentArticles.length ? (
            localizedRecentArticles.map((article) => (
              <ArticleCard
                key={article._id.toString()}
                article={{
                  title: resolveArticleLocalization(article, locale).title || article.title,
                  slug: resolveArticleLocalization(article, locale).slug || article.slug,
                  excerpt: resolveArticleLocalization(article, locale).excerpt ?? undefined,
                  category: article.category ?? undefined,
                  coverImage: article.coverImage ?? undefined,
                  publishedAt: article.publishedAt ?? undefined,
                }}
              />
            ))
          ) : (
            <div className="panel p-6 text-muted">{messages.home.noArticles}</div>
          )}
        </div>
      </section>
    </div>
  );
}