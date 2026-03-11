import type { Metadata } from "next";
import Link from "next/link";

import { formatDate, getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getLatestPersistedTrendSnapshot, getRssTrendSnapshot } from "@/lib/rssTrends";
import { buildCollectionJsonLd, buildMetadata } from "@/lib/seo";
import { slugify } from "@/lib/slugify";
import Anime from "@/models/Anime";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type CategoryRow = {
  _id: string;
  count: number;
  latestPublishedAt?: Date;
};

type SeasonRow = {
  _id: string;
  animeCount: number;
  animeTitles: string[];
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return buildMetadata({
    title: messages.explore.title,
    description: messages.explore.description,
    path: "/explore",
  });
}

export default async function ExplorePage() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  await connectToDatabase();

  const [latestArticles, categoryRows, tagRows, seasonRows, animeRows, liveRssSnapshot, persistedTrendSnapshot] = await Promise.all([
    Article.find({ status: "published" })
      .sort({ publishedAt: -1, updatedAt: -1 })
      .limit(8)
      .lean(),
    Article.aggregate<CategoryRow>([
      { $match: { status: "published", category: { $type: "string", $ne: "" } } },
      { $group: { _id: "$category", count: { $sum: 1 }, latestPublishedAt: { $max: "$publishedAt" } } },
      { $sort: { count: -1, latestPublishedAt: -1, _id: 1 } },
      { $limit: 8 },
    ]),
    Article.aggregate<{ _id: string; count: number }>([
      { $match: { status: "published", tags: { $exists: true, $ne: [] } } },
      { $unwind: "$tags" },
      { $match: { tags: { $type: "string", $ne: "" } } },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
    ]),
    Anime.aggregate<SeasonRow>([
      { $match: { seasons: { $exists: true, $ne: [] } } },
      { $unwind: "$seasons" },
      { $match: { seasons: { $type: "string", $ne: "" } } },
      { $group: { _id: "$seasons", animeCount: { $sum: 1 }, animeTitles: { $addToSet: "$title" } } },
      { $sort: { _id: -1 } },
      { $limit: 6 },
    ]),
    Anime.find({}).sort({ isPopularNow: -1, popularityScore: -1, updatedAt: -1 }).limit(8).lean(),
    getRssTrendSnapshot(),
    getLatestPersistedTrendSnapshot(),
  ]);

  const trendSourceRows = liveRssSnapshot.sourceRows.length ? liveRssSnapshot.sourceRows : persistedTrendSnapshot?.sourceRows || [];
  const trendTopicRows = liveRssSnapshot.topicRows.length ? liveRssSnapshot.topicRows : persistedTrendSnapshot?.topicRows || [];
  const trendLiveItems = liveRssSnapshot.liveItems.length ? liveRssSnapshot.liveItems : persistedTrendSnapshot?.liveItems || [];

  const jsonLd = buildCollectionJsonLd({
    title: messages.explore.title,
    description: messages.explore.description,
    path: "/explore",
    itemPaths: [
      ...latestArticles.map((article) => `/article/${article.slug}`),
      ...categoryRows.map((category) => `/category/${category._id}`),
    ],
  });

  return (
    <div className="shell-container py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="panel px-6 py-8 md:px-10 md:py-12">
        <span className="eyebrow">{messages.explore.eyebrow}</span>
        <h1 className="mt-5 font-display text-4xl font-semibold md:text-6xl">{messages.explore.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{messages.explore.description}</p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="panel p-6 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{messages.trending.eyebrow}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold">{messages.explore.trendingTitle}</h2>
            </div>
            <Link className="button-secondary" href="/trending">{messages.explore.openDetail}</Link>
          </div>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-muted">{messages.trending.topCategories}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {(trendSourceRows.length ? trendSourceRows : categoryRows.slice(0, 4)).slice(0, 4).map((category) => (
                  <Link key={category._id} className="button-secondary" href={`/search?q=${encodeURIComponent(category._id)}`}>
                    {category._id} · {category.count}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-muted">{messages.trending.hotTopics}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {(trendTopicRows.length ? trendTopicRows : tagRows.slice(0, 6)).slice(0, 6).map((tag) => (
                  <Link key={tag._id} className="button-secondary" href={`/tag/${slugify(tag._id)}`}>
                    #{tag._id} · {tag.count}
                  </Link>
                ))}
              </div>
            </div>
            {trendLiveItems.length ? (
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-muted">{messages.explore.liveRssTitle}</p>
                <div className="mt-4 grid gap-3">
                  {trendLiveItems.slice(0, 4).map((item) => (
                    <a
                      key={`${item.sourceLabel}-${item.url}`}
                      className="rounded-3xl border border-line bg-white/45 p-4 transition-transform hover:-translate-y-0.5"
                      href={item.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <p className="text-sm uppercase tracking-[0.16em] text-muted">{item.sourceLabel}</p>
                      <h3 className="mt-2 font-semibold">{item.title}</h3>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="panel p-6 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{messages.season.eyebrow}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold">{messages.explore.seasonTitle}</h2>
            </div>
            <Link className="button-secondary" href="/season">{messages.explore.openDetail}</Link>
          </div>
          <div className="mt-6 grid gap-4">
            {seasonRows.length ? (
              seasonRows.map((season) => (
                <div key={season._id} className="rounded-3xl border border-line bg-white/45 p-5">
                  <h3 className="font-display text-2xl font-semibold">{season._id}</h3>
                  <p className="mt-2 text-sm text-muted">{season.animeCount} {messages.season.animeCount}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {season.animeTitles.slice(0, 4).map((title) => (
                      <span key={title} className="rounded-full bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
                        {title}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-line bg-white/45 p-5 text-muted">{messages.season.empty}</div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 panel p-6 md:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{messages.categories.eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">{messages.explore.categoriesTitle}</h2>
          </div>
          <Link className="button-secondary" href="/categories">{messages.explore.openDetail}</Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid-auto-fit">
            {categoryRows.length ? (
              categoryRows.map((category) => (
                <Link key={category._id} href={`/category/${category._id}`} className="rounded-3xl border border-line bg-white/45 p-5 transition-transform hover:-translate-y-0.5">
                  <p className="text-sm uppercase tracking-[0.16em] text-muted">{messages.category.eyebrow}</p>
                  <h3 className="mt-3 font-display text-2xl font-semibold capitalize">{category._id.replace(/-/g, " ")}</h3>
                  <p className="mt-2 text-sm text-muted">{category.count} {messages.categories.itemSuffix}</p>
                  <p className="mt-2 text-sm text-muted">{messages.categories.latest}: {formatDate(locale, category.latestPublishedAt || new Date())}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-3xl border border-line bg-white/45 p-5 text-muted">{messages.categories.empty}</div>
            )}
          </div>

          <aside className="rounded-3xl border border-line bg-white/45 p-5">
            <p className="text-sm uppercase tracking-[0.16em] text-muted">{messages.categories.animeTitle}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {animeRows.length ? (
                animeRows.map((anime) => (
                  <Link key={anime._id.toString()} className="button-secondary" href={`/anime/${anime.slug}`}>
                    {anime.title}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted">{messages.explore.animeFallback}</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}