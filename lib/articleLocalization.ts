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
  const alternateLocale: Locale = locale === "fr" ? "en" : "fr";
  const alternate = article.localizations?.[alternateLocale];

  return {
    slug: pickText(current?.slug, alternate?.slug),
    title: pickText(current?.title, alternate?.title, article.title),
    excerpt: pickText(current?.excerpt, alternate?.excerpt, article.excerpt),
    content: pickText(current?.content, alternate?.content, article.content),
    seo: {
      metaTitle: pickText(current?.seo?.metaTitle, alternate?.seo?.metaTitle, article.seo?.metaTitle),
      metaDesc: pickText(current?.seo?.metaDesc, alternate?.seo?.metaDesc, article.seo?.metaDesc),
      ogImage: pickText(current?.seo?.ogImage, alternate?.seo?.ogImage, article.seo?.ogImage),
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
    en: {
      slug: normalizeText(payload?.en?.slug),
      title: normalizeText(payload?.en?.title),
      excerpt: normalizeText(payload?.en?.excerpt),
      content: normalizeText(payload?.en?.content),
      seo: {
        metaTitle: normalizeText(payload?.en?.seo?.metaTitle),
        metaDesc: normalizeText(payload?.en?.seo?.metaDesc),
        ogImage: normalizeText(payload?.en?.seo?.ogImage),
      },
    },
  };
}