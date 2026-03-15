import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import AdUnit from "@/app/components/AdUnit";
import ArticleCard from "@/app/components/ArticleCard";
import newsHeroCover from "@/assets/images/satoru-gojo-jujutsu-3840x2160-9295.jpg";
import { resolveArticleLocalization } from "@/lib/articleLocalization";
import { ensureArticlesLocalization } from "@/lib/articleTranslation";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { buildCollectionJsonLd, buildMetadata } from "@/lib/seo";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type ArticlesPageProps = {
  searchParams?: Promise<{ page?: string }>;
};

const PAGE_SIZE = 9;

export async function generateMetadata({ searchParams }: ArticlesPageProps): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const resolved = searchParams ? await searchParams : undefined;
  const page = Math.max(1, Number(resolved?.page || "1") || 1);
  const isFirstPage = page <= 1;

  return buildMetadata({
    title: isFirstPage ? messages.news.title : `${messages.news.title} - Page ${page}`,
    description: messages.news.archiveNote,
    path: isFirstPage ? "/articles" : `/articles?page=${page}`,
  });
}

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
  const localizedArticles = await ensureArticlesLocalization(articles, locale);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const jsonLd = buildCollectionJsonLd({
    title: messages.news.title,
    description: messages.news.archiveNote,
    path: page <= 1 ? "/articles" : `/articles?page=${page}`,
    itemPaths: localizedArticles.map((article) => `/article/${resolveArticleLocalization(article, locale).slug || article.slug}`),
  });

  return (
    <div className="shell-container py-6 md:py-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="panel news-hero overflow-hidden px-5 py-6 md:px-8 md:py-8">
        <div className="news-hero-media-layer" aria-hidden="true">
          <Image
            alt=""
            className="h-full w-full object-cover"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1080px"
            src={newsHeroCover}
          />
        </div>
        <div className="news-hero-overlay" aria-hidden="true" />
        <div className="news-hero-content">
          <span className="eyebrow">{messages.news.eyebrow}</span>
          <div className="mt-3.5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="max-w-3xl font-display text-3xl font-semibold tracking-[-0.03em] md:text-5xl">{messages.news.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted md:text-[15px] md:leading-7">
                {messages.news.pagePrefix} {page} {messages.news.pageMiddle} {totalPages}. {messages.news.pageSuffix}
              </p>
            </div>
            <AdUnit slot="header" compact />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-5 md:mt-8 lg:grid-cols-[1fr_280px]">
        <div className="grid-auto-fit">
          {localizedArticles.map((article) => (
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