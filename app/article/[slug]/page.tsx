import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import AdUnit from "@/app/components/AdUnit";
import ArticleCard from "@/app/components/ArticleCard";
import ArticleExperienceControls from "@/app/components/ArticleExperienceControls";
import { formatDate, getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { buildArticleJsonLd, buildMetadata } from "@/lib/seo";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

async function getArticle(slug: string) {
  await connectToDatabase();
  return Article.findOne({ slug, status: "published" }).lean();
}

function getReadingTime(content?: string | null, excerpt?: string | null) {
  const rawText = (content || excerpt || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = rawText ? rawText.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / 220));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return buildMetadata({
      title: messages.article.notFoundTitle,
      description: messages.article.notFoundDescription,
      path: `/article/${slug}`,
      type: "article",
    });
  }

  return buildMetadata({
    title: article.seo?.metaTitle || article.title,
    description: article.seo?.metaDesc || article.excerpt || messages.article.fallbackDescription,
    path: `/article/${article.slug}`,
    image: article.seo?.ogImage || article.coverImage || undefined,
    type: "article",
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const jsonLd = buildArticleJsonLd({
    title: article.seo?.metaTitle || article.title,
    description: article.seo?.metaDesc || article.excerpt || messages.article.fallbackDescription,
    path: `/article/${article.slug}`,
    image: article.seo?.ogImage || article.coverImage || undefined,
    publishedTime: article.publishedAt ?? undefined,
    modifiedTime: article.updatedAt ?? undefined,
    tags: article.tags ?? undefined,
  });
  const readTime = getReadingTime(article.content, article.excerpt);
  const relatedFilters: Array<Record<string, unknown>> = [];

  if (article.category) {
    relatedFilters.push({ category: article.category });
  }

  if (article.tags?.length) {
    relatedFilters.push({ tags: { $in: article.tags } });
  }

  const relatedArticles = relatedFilters.length
    ? await Article.find({
        status: "published",
        slug: { $ne: article.slug },
        $or: relatedFilters,
      })
        .sort({ publishedAt: -1, updatedAt: -1 })
        .limit(3)
        .lean()
    : [];

  return (
    <div className="shell-container py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="panel reading-surface px-6 py-8 md:px-10 md:py-12">
          <span className="eyebrow">{article.category || messages.article.fallbackCategory}</span>
          <div className="article-measure">
            <h1 className="mt-5 font-display text-4xl font-semibold md:text-6xl md:leading-[1.05]">
              {article.title}
            </h1>
          </div>
          <div className="article-measure mt-5 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="status-chip status-chip-warning">{article.sourceName || messages.article.desk}</span>
            <span>
              {article.publishedAt
                ? formatDate(locale, article.publishedAt, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : messages.article.draftNotPublished}
            </span>
            <span>{readTime} {messages.article.minutesReadSuffix}</span>
          </div>
          <ArticleExperienceControls title={article.title} />
          {article.coverImage ? (
            <div className="article-measure relative mt-8 overflow-hidden rounded-3xl">
              <Image
                alt={article.title}
                className="h-auto w-full object-cover"
                height={720}
                priority
                sizes="(max-width: 900px) 100vw, 820px"
                src={article.coverImage}
                width={1280}
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent dark:from-black/30" />
            </div>
          ) : null}
          <div className="article-measure prose-content mt-8 text-base text-foreground">
            {article.content ? (
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            ) : (
              <p>{article.excerpt || messages.article.contentUnavailable}</p>
            )}
          </div>
          {relatedArticles.length ? (
            <section className="article-measure mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">{messages.article.relatedEyebrow}</p>
                  <h2 className="mt-3 font-display text-3xl font-semibold">{messages.article.relatedTitle}</h2>
                </div>
              </div>
              <div className="grid-auto-fit mt-6">
                {relatedArticles.map((relatedArticle) => (
                  <ArticleCard
                    key={relatedArticle._id.toString()}
                    article={{
                      title: relatedArticle.title,
                      slug: relatedArticle.slug,
                      excerpt: relatedArticle.excerpt ?? undefined,
                      category: relatedArticle.category ?? undefined,
                      coverImage: relatedArticle.coverImage ?? undefined,
                      publishedAt: relatedArticle.publishedAt ?? undefined,
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
        <aside className="reading-hide space-y-6">
          <AdUnit slot="afterFirstPara" />
          <AdUnit slot="inArticle" />
        </aside>
      </article>
    </div>
  );
}