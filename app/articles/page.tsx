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
    <div className="shell-container py-6 md:py-9">
      <div className="panel px-5 py-6 md:px-8 md:py-8">
        <span className="eyebrow">{messages.news.eyebrow}</span>
        <div className="mt-3.5 flex flex-col gap-3.5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold md:text-4xl">{messages.news.title}</h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-muted md:text-[15px]">
              {messages.news.pagePrefix} {page} {messages.news.pageMiddle} {totalPages}. {messages.news.pageSuffix}
            </p>
          </div>
          <AdUnit slot="header" compact />
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:mt-8 lg:grid-cols-[1fr_280px]">
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
        <aside className="space-y-5">
          <AdUnit slot="sidebar" />
          <div className="panel p-5 text-[13px] leading-6 text-muted md:text-sm">{messages.news.archiveNote}</div>
          <div className="panel p-5 md:p-6">
            <p className="eyebrow">{messages.recommendations.eyebrow}</p>
            <h2 className="mt-3 font-display text-xl font-semibold md:text-2xl">{messages.recommendations.title}</h2>
            <p className="mt-2.5 text-[13px] leading-6 text-muted md:text-sm">{messages.recommendations.description}</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-sm text-muted">{recommendationCount}</span>
              <Link className="button-secondary" href="/recommendations">
                {messages.recommendations.explore}
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-6 flex items-center justify-between md:mt-8">
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