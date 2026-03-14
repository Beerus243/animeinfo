import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";

import AdUnit from "@/app/components/AdUnit";
import ArticleCard from "@/app/components/ArticleCard";
import ArticleExperienceControls from "@/app/components/ArticleExperienceControls";
import { resolveArticleLocalization } from "@/lib/articleLocalization";
import { ensureArticleLocalization, ensureArticlesLocalization } from "@/lib/articleTranslation";
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
  return Article.findOne({
    status: "published",
    $or: [
      { slug },
      { "localizations.fr.slug": slug },
    ],
  }).lean();
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

  const hydratedArticle = await ensureArticleLocalization(article, locale);
  const localized = resolveArticleLocalization(hydratedArticle, locale);
  const localizedSlug = localized.slug || hydratedArticle.slug;
  const frSlug = hydratedArticle.localizations?.fr?.slug || hydratedArticle.slug;
  const languageAlternates = {
    fr: `/article/${frSlug}`,
    "x-default": `/article/${frSlug}`,
  };

  return buildMetadata({
    title: localized.seo.metaTitle || localized.title || article.title,
    description: localized.seo.metaDesc || localized.excerpt || messages.article.fallbackDescription,
    path: `/article/${localizedSlug}`,
    image: localized.seo.ogImage || hydratedArticle.coverImage || undefined,
    type: "article",
    languages: languageAlternates,
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

  const hydratedArticle = await ensureArticleLocalization(article, locale);
  const localized = resolveArticleLocalization(hydratedArticle, locale);
  const localizedSlug = localized.slug || hydratedArticle.slug;
  const sourceLanguageLabel = messages.locales[localized.sourceLocale];
  const requestedLanguageLabel = messages.locales[locale];
  const browserTranslationNotice = localized.isFallback
    ? messages.article.browserTranslationNotice
        .replace("{locale}", requestedLanguageLabel)
        .replace("{sourceLocale}", sourceLanguageLabel)
    : null;

  if (slug !== localizedSlug) {
    permanentRedirect(`/article/${localizedSlug}`);
  }

  const jsonLd = buildArticleJsonLd({
    title: localized.seo.metaTitle || localized.title || hydratedArticle.title,
    description: localized.seo.metaDesc || localized.excerpt || messages.article.fallbackDescription,
    path: `/article/${localizedSlug}`,
    image: localized.seo.ogImage || hydratedArticle.coverImage || undefined,
    publishedTime: hydratedArticle.publishedAt ?? undefined,
    modifiedTime: hydratedArticle.updatedAt ?? undefined,
    tags: hydratedArticle.tags ?? undefined,
  });
  const readTime = getReadingTime(localized.content, localized.excerpt);
  const relatedFilters: Array<Record<string, unknown>> = [];

  if (hydratedArticle.category) {
    relatedFilters.push({ category: hydratedArticle.category });
  }

  if (hydratedArticle.tags?.length) {
    relatedFilters.push({ tags: { $in: hydratedArticle.tags } });
  }

  const relatedArticles = relatedFilters.length
    ? await Article.find({
        status: "published",
        slug: { $ne: hydratedArticle.slug },
        $or: relatedFilters,
      })
        .sort({ publishedAt: -1, updatedAt: -1 })
        .limit(3)
        .lean()
    : [];
  const localizedRelatedArticles = await ensureArticlesLocalization(relatedArticles, locale);

  return (
    <div className="shell-container py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="panel article-detail-shell reading-surface px-6 py-8 md:px-10 md:py-12">
          <span className="eyebrow">{hydratedArticle.category || messages.article.fallbackCategory}</span>
          <div className="article-measure">
            <h1 className="mt-5 font-display text-4xl font-semibold md:text-6xl md:leading-[1.05]" lang={localized.sourceLocale} translate="yes">
              {localized.title || hydratedArticle.title}
            </h1>
          </div>
          <div className="article-measure mt-5 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="status-chip status-chip-warning">{hydratedArticle.sourceName || messages.article.desk}</span>
            <span>
              {hydratedArticle.publishedAt
                ? formatDate(locale, hydratedArticle.publishedAt, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : messages.article.draftNotPublished}
            </span>
            <span>{readTime} {messages.article.minutesReadSuffix}</span>
          </div>
          {browserTranslationNotice ? (
            <div className="article-measure mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted" role="status">
              {browserTranslationNotice}
            </div>
          ) : null}
          <ArticleExperienceControls title={localized.title || hydratedArticle.title} />
          {hydratedArticle.coverImage ? (
            <div className="article-detail-cover article-measure relative mt-8 overflow-hidden rounded-3xl">
              <Image
                alt={localized.title || hydratedArticle.title}
                className="h-auto w-full object-cover"
                height={720}
                priority
                sizes="(max-width: 900px) 100vw, 820px"
                src={hydratedArticle.coverImage}
                width={1280}
              />
              <div className="article-detail-cover-overlay pointer-events-none absolute inset-0" />
            </div>
          ) : null}
          <div className="article-measure prose-content mt-8 text-base text-foreground" lang={localized.sourceLocale} translate="yes">
            {localized.content ? (
              <div dangerouslySetInnerHTML={{ __html: localized.content }} />
            ) : (
              <p>{localized.excerpt || messages.article.contentUnavailable}</p>
            )}
          </div>
          {localizedRelatedArticles.length ? (
            <section className="article-measure mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">{messages.article.relatedEyebrow}</p>
                  <h2 className="mt-3 font-display text-3xl font-semibold">{messages.article.relatedTitle}</h2>
                </div>
              </div>
              <div className="grid-auto-fit mt-6">
                {localizedRelatedArticles.map((relatedArticle) => (
                  <ArticleCard
                    key={relatedArticle._id.toString()}
                    article={{
                      title: resolveArticleLocalization(relatedArticle, locale).title || relatedArticle.title,
                      slug: resolveArticleLocalization(relatedArticle, locale).slug || relatedArticle.slug,
                      excerpt: resolveArticleLocalization(relatedArticle, locale).excerpt ?? undefined,
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