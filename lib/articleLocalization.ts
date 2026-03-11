import type { Locale } from "@/lib/i18n/messages";

type LocalizedSeoFields = {
  metaTitle?: string | null;
  metaDesc?: string | null;
  ogImage?: string | null;
};

type LocalizedArticleFields = {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  seo?: LocalizedSeoFields | null;
};

type ArticleWithLocalizations = {
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  seo?: LocalizedSeoFields | null;
  localizations?: Partial<Record<Locale, LocalizedArticleFields>> | null;
};

function normalizeText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function pickText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

export function resolveArticleLocalization(article: ArticleWithLocalizations, locale: Locale) {
  const current = article.localizations?.[locale];
  const fallback = article.localizations?.fr;
  const sourceLocale = normalizeText(current?.content) || normalizeText(current?.title) || normalizeText(current?.excerpt)
    ? locale
    : "fr";

  return {
    slug: pickText(current?.slug, fallback?.slug, article.localizations?.fr?.slug),
    title: pickText(current?.title, fallback?.title, article.title),
    excerpt: pickText(current?.excerpt, fallback?.excerpt, article.excerpt),
    content: pickText(current?.content, fallback?.content, article.content),
    requestedLocale: locale,
    sourceLocale,
    isFallback: sourceLocale !== locale,
    seo: {
      metaTitle: pickText(current?.seo?.metaTitle, fallback?.seo?.metaTitle, article.seo?.metaTitle),
      metaDesc: pickText(current?.seo?.metaDesc, fallback?.seo?.metaDesc, article.seo?.metaDesc),
      ogImage: pickText(current?.seo?.ogImage, fallback?.seo?.ogImage, article.seo?.ogImage),
    },
  };
}

export function buildArticleLocalizations(payload?: Partial<Record<Locale, LocalizedArticleFields>> | null) {
  return {
    fr: {
      slug: normalizeText(payload?.fr?.slug),
      title: normalizeText(payload?.fr?.title),
      excerpt: normalizeText(payload?.fr?.excerpt),
      content: normalizeText(payload?.fr?.content),
      seo: {
        metaTitle: normalizeText(payload?.fr?.seo?.metaTitle),
        metaDesc: normalizeText(payload?.fr?.seo?.metaDesc),
        ogImage: normalizeText(payload?.fr?.seo?.ogImage),
      },
    },
  };
}