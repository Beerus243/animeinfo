import { ensureUniqueArticleSlug } from "@/lib/articleDrafts";
import { resolveArticleLocalization } from "@/lib/articleLocalization";
import type { Locale } from "@/lib/i18n/messages";
import Article from "@/models/Article";

type TranslationFields = {
  title?: string;
  excerpt?: string;
  content?: string;
  seo?: {
    metaTitle?: string;
    metaDesc?: string;
  };
};

type TranslationResult = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  seo: {
    metaTitle: string;
    metaDesc: string;
  };
};

type TranslatableArticle = {
  _id?: { toString(): string } | string;
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  seo?: {
    metaTitle?: string | null;
    metaDesc?: string | null;
    ogImage?: string | null;
  } | null;
  localizations?: Partial<Record<Locale, {
    slug?: string | null;
    title?: string | null;
    excerpt?: string | null;
    content?: string | null;
    seo?: {
      metaTitle?: string | null;
      metaDesc?: string | null;
      ogImage?: string | null;
    } | null;
  }>> | null;
  category?: string | null;
  coverImage?: string | null;
  sourceName?: string | null;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
  tags?: string[] | null;
};

export function getTranslationConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_TRANSLATION_MODEL || process.env.OPENAI_MODEL;
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

  if (!apiKey || !model) {
    return null;
  }

  return { apiKey, model, baseUrl };
}

export function isAutomaticTranslationConfigured() {
  return Boolean(getTranslationConfig());
}

function hasContent(fields?: TranslationFields | null) {
  return Boolean(
    fields && [fields.title, fields.excerpt, fields.content, fields.seo?.metaTitle, fields.seo?.metaDesc].some((value) => value?.trim()),
  );
}

function cleanJsonContent(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  return trimmed;
}

export async function translateArticleFields(input: {
  sourceLocale: Locale;
  targetLocale: Locale;
  fields: TranslationFields;
}) {
  const config = getTranslationConfig();
  if (!config) {
    throw new Error("Translation API is not configured.");
  }

  if (input.sourceLocale === input.targetLocale) {
    throw new Error("Invalid source or target locale.");
  }

  if (!hasContent(input.fields)) {
    throw new Error("Missing source article content.");
  }

  const sourceLanguage = input.sourceLocale === "fr" ? "French" : "English";
  const targetLanguage = input.targetLocale === "fr" ? "French" : "English";

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a professional editorial translator for anime news. Translate accurately while preserving meaning, tone, HTML tags, structure, and proper nouns. Return strict JSON only with keys: title, excerpt, content, seoMetaTitle, seoMetaDesc.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: `Translate this article draft from ${sourceLanguage} to ${targetLanguage}. Preserve HTML in content and do not add commentary.`,
            fields: {
              title: input.fields.title || "",
              excerpt: input.fields.excerpt || "",
              content: input.fields.content || "",
              seoMetaTitle: input.fields.seo?.metaTitle || "",
              seoMetaDesc: input.fields.seo?.metaDesc || "",
            },
          }),
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Translation provider error: ${response.status} ${errorText}`.trim());
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  if (typeof rawContent !== "string") {
    throw new Error("Translation provider returned an invalid response.");
  }

  const translated = JSON.parse(cleanJsonContent(rawContent)) as {
    title?: string;
    excerpt?: string;
    content?: string;
    seoMetaTitle?: string;
    seoMetaDesc?: string;
  };

  return {
    slug: translated.title ? await ensureUniqueArticleSlug(translated.title) : "",
    title: translated.title || "",
    excerpt: translated.excerpt || "",
    content: translated.content || "",
    seo: {
      metaTitle: translated.seoMetaTitle || "",
      metaDesc: translated.seoMetaDesc || "",
    },
  } satisfies TranslationResult;
}

export async function ensureArticleLocalization<T extends TranslatableArticle>(article: T, locale: Locale): Promise<T> {
  const existingLocalization = article.localizations?.[locale];
  const hasTargetContent = hasContent({
    title: existingLocalization?.title || undefined,
    excerpt: existingLocalization?.excerpt || undefined,
    content: existingLocalization?.content || undefined,
    seo: {
      metaTitle: existingLocalization?.seo?.metaTitle || undefined,
      metaDesc: existingLocalization?.seo?.metaDesc || undefined,
    },
  });

  if (hasTargetContent || !isAutomaticTranslationConfigured()) {
    return article;
  }

  const resolved = resolveArticleLocalization(article, locale);
  if (!resolved.isFallback || !hasContent(resolved)) {
    return article;
  }

  const translation = await translateArticleFields({
    sourceLocale: resolved.sourceLocale,
    targetLocale: locale,
    fields: {
      title: resolved.title,
      excerpt: resolved.excerpt,
      content: resolved.content,
      seo: {
        metaTitle: resolved.seo.metaTitle,
        metaDesc: resolved.seo.metaDesc,
      },
    },
  });

  const articleId = article._id ? article._id.toString() : undefined;
  const reservedSlugs = [article.slug, article.localizations?.fr?.slug, article.localizations?.en?.slug]
    .filter((value): value is string => Boolean(value));
  const localizedSlug = translation.title
    ? await ensureUniqueArticleSlug(translation.title, { excludeId: articleId, reservedSlugs })
    : existingLocalization?.slug || "";

  const nextLocalization = {
    slug: localizedSlug,
    title: translation.title,
    excerpt: translation.excerpt,
    content: translation.content,
    seo: {
      ...existingLocalization?.seo,
      metaTitle: translation.seo.metaTitle,
      metaDesc: translation.seo.metaDesc,
    },
  };

  const nextLocalizations = {
    ...article.localizations,
    [locale]: nextLocalization,
  };

  const updateSet: Record<string, unknown> = {
    [`localizations.${locale}`]: nextLocalization,
  };

  const hasEnglishLocalization = hasContent({
    title: article.localizations?.en?.title || undefined,
    excerpt: article.localizations?.en?.excerpt || undefined,
    content: article.localizations?.en?.content || undefined,
    seo: {
      metaTitle: article.localizations?.en?.seo?.metaTitle || undefined,
      metaDesc: article.localizations?.en?.seo?.metaDesc || undefined,
    },
  });

  if (locale === "fr") {
    if (resolved.sourceLocale === "en" && !hasEnglishLocalization) {
      const preservedEnglishLocalization = {
        slug: article.localizations?.en?.slug || article.slug || "",
        title: article.title || "",
        excerpt: article.excerpt || "",
        content: article.content || "",
        seo: {
          metaTitle: article.seo?.metaTitle || "",
          metaDesc: article.seo?.metaDesc || "",
          ogImage: article.localizations?.en?.seo?.ogImage || article.seo?.ogImage || "",
        },
      };

      nextLocalizations.en = preservedEnglishLocalization;
      updateSet["localizations.en"] = preservedEnglishLocalization;
    }

    updateSet.title = nextLocalization.title;
    updateSet.slug = localizedSlug;
    updateSet.excerpt = nextLocalization.excerpt;
    updateSet.content = nextLocalization.content;
    updateSet.seo = {
      metaTitle: nextLocalization.seo.metaTitle,
      metaDesc: nextLocalization.seo.metaDesc,
      ogImage: article.seo?.ogImage || article.localizations?.fr?.seo?.ogImage || article.coverImage || "",
    };
  }

  if (articleId) {
    await Article.updateOne(
      { _id: articleId },
      {
        $set: updateSet,
      },
    );
  }

  return {
    ...article,
    ...(locale === "fr"
      ? {
          title: nextLocalization.title,
          slug: localizedSlug,
          excerpt: nextLocalization.excerpt,
          content: nextLocalization.content,
          seo: {
            ...article.seo,
            metaTitle: nextLocalization.seo.metaTitle,
            metaDesc: nextLocalization.seo.metaDesc,
          },
        }
      : {}),
    localizations: nextLocalizations,
  };
}

export async function ensureArticlesLocalization<T extends TranslatableArticle>(articles: T[], locale: Locale): Promise<T[]> {
  if (!articles.length || !isAutomaticTranslationConfigured()) {
    return articles;
  }

  return Promise.all(articles.map((article) => ensureArticleLocalization(article, locale)));
}