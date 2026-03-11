import type { Metadata } from "next";
import Link from "next/link";

import ArticleCard from "@/app/components/ArticleCard";
import { formatDate, getMessages } from "@/lib/i18n/messages";
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
    title: messages.trending.title,
    description: messages.trending.description,
    path: "/trending",
  });
}

export default async function TrendingPage() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  await connectToDatabase();

  const [articles, categoryRows, tagRows] = await Promise.all([
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
  ]);

  const jsonLd = buildCollectionJsonLd({
    title: messages.trending.title,
    description: messages.trending.description,
    path: "/trending",
    itemPaths: articles.map((article) => `/article/${article.slug}`),
  });

  return (
    <div className="shell-container py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="panel px-6 py-8 md:px-10 md:py-12">
        <span className="eyebrow">{messages.trending.eyebrow}</span>
        <h1 className="mt-5 font-display text-4xl font-semibold md:text-6xl">{messages.trending.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{messages.trending.description}</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-line bg-surface-strong p-6">
            <p className="text-sm uppercase tracking-[0.16em] text-muted">{messages.trending.topCategories}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {categoryRows.map((category) => (
                <Link key={category._id} className="button-secondary" href={`/category/${category._id}`}>
                  {category._id} · {category.count}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-surface-strong p-6">
            <p className="text-sm uppercase tracking-[0.16em] text-muted">{messages.trending.hotTopics}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {tagRows.map((tag) => (
                <Link key={tag._id} className="button-secondary" href={`/tag/${slugify(tag._id)}`}>
                  #{tag._id} · {tag.count}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid-auto-fit mt-8">
        {articles.length ? (
          articles.map((article) => (
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
          <div className="panel p-6 text-muted">{messages.trending.noArticles}</div>
        )}
      </div>

      {articles.length ? (
        <section className="mt-8 panel px-6 py-6 md:px-8">
          <p className="text-sm text-muted">
            {messages.news.pagePrefix} 1. {messages.categories.latest}: {formatDate(locale, articles[0].publishedAt || new Date())}
          </p>
        </section>
      ) : null}
    </div>
  );
}