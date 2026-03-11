import type { Metadata } from "next";
import Link from "next/link";

import ArticleCard from "@/app/components/ArticleCard";
import { resolveArticleLocalization } from "@/lib/articleLocalization";
import { ensureArticlesLocalization } from "@/lib/articleTranslation";
import { formatDate, getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getRssTrendSnapshot } from "@/lib/rssTrends";
import { buildCollectionJsonLd, buildMetadata } from "@/lib/seo";
import { slugify } from "@/lib/slugify";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return buildMetadata({
    title: messages.trending.title,
    description: messages.trending.description,
    path: "/trending",
  });
}

export default async function TrendingPage() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  await connectToDatabase();

  const [articles, categoryRows, tagRows, rssSnapshot] = await Promise.all([
    Article.find({ status: "published" })
      .sort({ publishedAt: -1, updatedAt: -1 })
      .limit(12)
      .lean(),
    Article.aggregate<{ _id: string; count: number }>([
      { $match: { status: "published", category: { $type: "string", $ne: "" } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 6 },
    ]),
    Article.aggregate<{ _id: string; count: number }>([
      { $match: { status: "published", tags: { $exists: true, $ne: [] } } },
      { $unwind: "$tags" },
      { $match: { tags: { $type: "string", $ne: "" } } },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
    ]),
    getRssTrendSnapshot(),
  ]);

  const effectiveCategoryRows = categoryRows.length ? categoryRows : rssSnapshot.sourceRows;
  const effectiveTagRows = tagRows.length ? tagRows : rssSnapshot.topicRows;
  const localizedArticles = await ensureArticlesLocalization(articles, locale);

  const jsonLd = buildCollectionJsonLd({
    title: messages.trending.title,
    description: messages.trending.description,
    path: "/trending",
    itemPaths: localizedArticles.length
      ? localizedArticles.map((article) => `/article/${resolveArticleLocalization(article, locale).slug || article.slug}`)
      : rssSnapshot.liveItems.map((item) => item.url),
  });

  return (
    <div className="shell-container py-6 md:py-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="panel px-5 py-6 md:px-8 md:py-8">
        <span className="eyebrow">{messages.trending.eyebrow}</span>
        <h1 className="mt-4 font-display text-3xl font-semibold md:text-5xl">{messages.trending.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted md:text-base md:leading-7">{messages.trending.description}</p>
        <div className="mt-6 grid gap-3.5 lg:grid-cols-2">
          <div className="content-card p-4 md:p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{messages.trending.topCategories}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {effectiveCategoryRows.map((category) => (
                <Link key={category._id} className="button-secondary" href={`/search?q=${encodeURIComponent(category._id)}`}>
                  {category._id} · {category.count}
                </Link>
              ))}
            </div>
          </div>
          <div className="content-card p-4 md:p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{messages.trending.hotTopics}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {effectiveTagRows.map((tag) => (
                <Link key={tag._id} className="button-secondary" href={`/tag/${slugify(tag._id)}`}>
                  #{tag._id} · {tag.count}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {rssSnapshot.liveItems.length ? (
        <section className="mt-6 panel px-5 py-6 md:mt-8 md:px-6 md:py-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{messages.trending.rssEyebrow}</p>
              <h2 className="mt-2.5 font-display text-2xl font-semibold md:text-[1.7rem]">{messages.trending.rssTitle}</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3.5 lg:grid-cols-2">
            {rssSnapshot.liveItems.map((item) => (
              <a
                key={`${item.sourceLabel}-${item.url}`}
                className="content-card p-4 transition-transform hover:-translate-y-0.5"
                href={item.url}
                rel="noreferrer"
                target="_blank"
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{item.sourceLabel}</p>
                <h3 className="mt-2 font-display text-xl font-semibold md:text-[1.35rem]">{item.title}</h3>
                {item.publishedAt ? <p className="mt-2 text-[13px] text-muted">{formatDate(locale, item.publishedAt)}</p> : null}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid-auto-fit mt-6 md:mt-8">
        {localizedArticles.length ? (
          localizedArticles.map((article) => (
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
          <div className="panel p-5 text-sm text-muted">{messages.trending.noArticles}</div>
        )}
      </div>

      {localizedArticles.length ? (
        <section className="mt-6 panel px-5 py-5 md:mt-8 md:px-6">
          <p className="text-[13px] text-muted md:text-sm">
            {messages.news.pagePrefix} 1. {messages.categories.latest}: {formatDate(locale, localizedArticles[0].publishedAt || new Date())}
          </p>
        </section>
      ) : null}
    </div>
  );
}