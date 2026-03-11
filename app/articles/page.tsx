import Link from "next/link";

import AdUnit from "@/app/components/AdUnit";
import ArticleCard from "@/app/components/ArticleCard";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type ArticlesPageProps = {
  searchParams?: Promise<{ page?: string }>;
};

const PAGE_SIZE = 9;

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const resolved = searchParams ? await searchParams : undefined;
  const page = Number(resolved?.page || "1") || 1;

  await connectToDatabase();

  const [articles, total, recommendationCount] = await Promise.all([
    Article.find({ status: "published" })
      .sort({ publishedAt: -1, updatedAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Article.countDocuments({ status: "published" }),
    Article.countDocuments({ status: "published", section: "recommendation" }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="shell-container py-8 md:py-12">
      <div className="panel px-6 py-8 md:px-10">
        <span className="eyebrow">{messages.news.eyebrow}</span>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold md:text-5xl">{messages.news.title}</h1>
            <p className="mt-3 max-w-2xl text-muted">
              {messages.news.pagePrefix} {page} {messages.news.pageMiddle} {totalPages}. {messages.news.pageSuffix}
            </p>
          </div>
          <AdUnit slot="header" compact />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="grid-auto-fit">
          {articles.map((article) => (
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
          ))}
        </div>
        <aside className="space-y-6">
          <AdUnit slot="sidebar" />
          <div className="panel p-6 text-sm leading-7 text-muted">{messages.news.archiveNote}</div>
          <div className="panel p-6">
            <p className="eyebrow">{messages.recommendations.eyebrow}</p>
            <h2 className="mt-4 font-display text-2xl font-semibold">{messages.recommendations.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{messages.recommendations.description}</p>
            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="text-sm text-muted">{recommendationCount}</span>
              <Link className="button-secondary" href="/recommendations">
                {messages.recommendations.explore}
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Link className="button-secondary" href={page > 1 ? `/articles?page=${page - 1}` : "/articles"}>
          {messages.news.previous}
        </Link>
        <Link className="button-primary" href={page < totalPages ? `/articles?page=${page + 1}` : `/articles?page=${totalPages}`}>
          {messages.news.next}
        </Link>
      </div>
    </div>
  );
}