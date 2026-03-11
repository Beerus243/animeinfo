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
    ogImage?: string;
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

type AiTaskKind = "translation" | "rewrite";

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

function getAiConfig(task: AiTaskKind) {
  const apiKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  const model =
    (task === "translation"
      ? process.env.AI_TRANSLATION_MODEL || process.env.DEEPSEEK_TRANSLATION_MODEL || process.env.OPENAI_TRANSLATION_MODEL
      : process.env.AI_REWRITE_MODEL || process.env.DEEPSEEK_REWRITE_MODEL) ||
    process.env.AI_MODEL ||
    process.env.DEEPSEEK_MODEL ||
    process.env.OPENAI_MODEL ||
    (process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : undefined);
  const baseUrl = (
    process.env.AI_BASE_URL ||
    process.env.DEEPSEEK_BASE_URL ||
    ((process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_MODEL) ? "https://api.deepseek.com/v1" : process.env.OPENAI_BASE_URL) ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");

  if (!apiKey || !model) {
    return null;
  }

  return { apiKey, model, baseUrl };
}

export function getTranslationConfig() {
  return getAiConfig("translation");
}

export function getRewriteConfig() {
  return getAiConfig("rewrite");
}

export function isAutomaticTranslationConfigured() {
  return Boolean(getTranslationConfig());
}

export function isAutomaticRewritingConfigured() {
  return Boolean(getRewriteConfig());
}

export function isFrenchAiPipelineConfigured() {
  return isAutomaticTranslationConfigured() || isAutomaticRewritingConfigured();
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

async function requestStructuredCompletion(input: {
  task: AiTaskKind;
  systemPrompt: string;
  userPayload: Record<string, unknown>;
}) {
  const config = input.task === "translation" ? getTranslationConfig() : getRewriteConfig();
  if (!config) {
    throw new Error(`AI ${input.task} is not configured.`);
  }

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
          content: input.systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify(input.userPayload),
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

  return JSON.parse(cleanJsonContent(rawContent)) as {
    title?: string;
    excerpt?: string;
    content?: string;
    seoMetaTitle?: string;
    seoMetaDesc?: string;
  };
}

export async function translateArticleFields(input: {
  sourceLocale: Locale;
  targetLocale: Locale;
  fields: TranslationFields;
}) {
  if (!getTranslationConfig()) {
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

  const translated = await requestStructuredCompletion({
    task: "translation",
    systemPrompt:
      "You are a professional editorial translator for anime news. Translate accurately while preserving meaning, tone, HTML tags, structure, and proper nouns. Adapt the phrasing so the result reads like polished native editorial copy. Return strict JSON only with keys: title, excerpt, content, seoMetaTitle, seoMetaDesc.",
    userPayload: {
      task: `Translate this article draft from ${sourceLanguage} to ${targetLanguage}. Preserve HTML in content and do not add commentary.`,
      fields: {
        title: input.fields.title || "",
        excerpt: input.fields.excerpt || "",
        content: input.fields.content || "",
        seoMetaTitle: input.fields.seo?.metaTitle || "",
        seoMetaDesc: input.fields.seo?.metaDesc || "",
      },
    },
  });

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

export async function rewriteArticleFields(input: {
  locale: Locale;
  fields: TranslationFields;
}) {
  if (!getRewriteConfig()) {
    throw new Error("AI rewrite is not configured.");
  }

  if (!hasContent(input.fields)) {
    throw new Error("Missing source article content.");
  }

  const targetLanguage = input.locale === "fr" ? "French" : "English";
  const rewritten = await requestStructuredCompletion({
    task: "rewrite",
    systemPrompt:
      "You are a senior anime news editor. Rewrite drafts into polished publication-ready copy while preserving facts, proper nouns, HTML tags, and structure. Improve clarity, rhythm, readability, and SEO wording without inventing information. Return strict JSON only with keys: title, excerpt, content, seoMetaTitle, seoMetaDesc.",
    userPayload: {
      task: `Rewrite this article in ${targetLanguage} for publication on an anime news site. Keep the same facts, improve editorial quality, and preserve HTML in content.`,
      fields: {
        title: input.fields.title || "",
        excerpt: input.fields.excerpt || "",
        content: input.fields.content || "",
        seoMetaTitle: input.fields.seo?.metaTitle || "",
        seoMetaDesc: input.fields.seo?.metaDesc || "",
      },
    },
  });

  return {
    slug: rewritten.title ? await ensureUniqueArticleSlug(rewritten.title) : "",
    title: rewritten.title || "",
    excerpt: rewritten.excerpt || "",
    content: rewritten.content || "",
    seo: {
      metaTitle: rewritten.seoMetaTitle || "",
      metaDesc: rewritten.seoMetaDesc || "",
    },
  } satisfies TranslationResult;
}

export async function buildFrenchFirstLocalizations(input: {
  sourceLocale: Locale;
  fields: TranslationFields;
  existingSlugs?: string[];
  excludeId?: string;
}) {
  const sourceFields = {
    title: input.fields.title || "",
    excerpt: input.fields.excerpt || "",
    content: input.fields.content || "",
    seo: {
      metaTitle: input.fields.seo?.metaTitle || "",
      metaDesc: input.fields.seo?.metaDesc || "",
      ogImage: input.fields.seo?.ogImage || "",
    },
  };

  let frenchFields = sourceFields;
  let aiRewritten = false;

  if (input.sourceLocale !== "fr" && isAutomaticTranslationConfigured()) {
    const translated = await translateArticleFields({
      sourceLocale: input.sourceLocale,
      targetLocale: "fr",
      fields: sourceFields,
    });
    frenchFields = {
      title: translated.title,
      excerpt: translated.excerpt,
      content: translated.content,
      seo: {
        metaTitle: translated.seo.metaTitle,
        metaDesc: translated.seo.metaDesc,
        ogImage: sourceFields.seo.ogImage,
      },
    };
  }

  if (isAutomaticRewritingConfigured()) {
    const rewritten = await rewriteArticleFields({
      locale: "fr",
      fields: frenchFields,
    });
    frenchFields = {
      title: rewritten.title,
      excerpt: rewritten.excerpt,
      content: rewritten.content,
      seo: {
        metaTitle: rewritten.seo.metaTitle,
        metaDesc: rewritten.seo.metaDesc,
        ogImage: sourceFields.seo.ogImage,
      },
    };
    aiRewritten = true;
  }

  const reservedSlugs = input.existingSlugs?.filter(Boolean) || [];
  const frSlug = frenchFields.title
    ? await ensureUniqueArticleSlug(frenchFields.title, { excludeId: input.excludeId, reservedSlugs })
    : "";
  const enSlug = input.sourceLocale === "en"
    ? sourceFields.title
      ? await ensureUniqueArticleSlug(sourceFields.title, {
          excludeId: input.excludeId,
          reservedSlugs: [frSlug, ...reservedSlugs],
        })
      : ""
    : "";

  return {
    aiRewritten,
    root: {
      slug: frSlug,
      title: frenchFields.title,
      excerpt: frenchFields.excerpt,
      content: frenchFields.content,
      seo: {
        metaTitle: frenchFields.seo.metaTitle,
        metaDesc: frenchFields.seo.metaDesc,
        ogImage: sourceFields.seo.ogImage,
      },
    },
    localizations: {
      fr: {
        slug: frSlug,
        title: frenchFields.title,
        excerpt: frenchFields.excerpt,
        content: frenchFields.content,
        seo: {
          metaTitle: frenchFields.seo.metaTitle,
          metaDesc: frenchFields.seo.metaDesc,
          ogImage: sourceFields.seo.ogImage,
        },
      },
      en: {
        slug: input.sourceLocale === "en" ? enSlug : "",
        title: input.sourceLocale === "en" ? sourceFields.title : "",
        excerpt: input.sourceLocale === "en" ? sourceFields.excerpt : "",
        content: input.sourceLocale === "en" ? sourceFields.content : "",
        seo: {
          metaTitle: input.sourceLocale === "en" ? sourceFields.seo.metaTitle : "",
          metaDesc: input.sourceLocale === "en" ? sourceFields.seo.metaDesc : "",
          ogImage: sourceFields.seo.ogImage,
        },
      },
    },
  };
}

export async function processStoredArticleToFrenchFirst(article: TranslatableArticle & { _id: { toString(): string } | string }) {
  const existingSlugs = [article.slug, article.localizations?.fr?.slug, article.localizations?.en?.slug].filter(
    (value): value is string => Boolean(value),
  );
  await Article.updateOne(
    { _id: article._id.toString() },
    {
      $set: {
        aiStatus: "pending",
      },
      $unset: {
        aiError: 1,
      },
    },
  );

  const processed = await buildFrenchFirstLocalizations({
    sourceLocale: article.localizations?.en?.title || article.localizations?.en?.content ? "en" : "en",
    fields: {
      title: article.localizations?.en?.title || article.title || "",
      excerpt: article.localizations?.en?.excerpt || article.excerpt || "",
      content: article.localizations?.en?.content || article.content || "",
      seo: {
        metaTitle: article.localizations?.en?.seo?.metaTitle || article.seo?.metaTitle || "",
        metaDesc: article.localizations?.en?.seo?.metaDesc || article.seo?.metaDesc || "",
        ogImage: article.localizations?.en?.seo?.ogImage || article.seo?.ogImage || article.coverImage || "",
      },
    },
    existingSlugs,
    excludeId: article._id.toString(),
  });

  await Article.updateOne(
    { _id: article._id.toString() },
    {
      $set: {
        title: processed.root.title,
        slug: processed.root.slug,
        excerpt: processed.root.excerpt,
        content: processed.root.content,
        seo: processed.root.seo,
        localizations: processed.localizations,
        aiStatus: "done",
        aiProcessedAt: new Date(),
        aiError: "",
        aiRewritten: processed.aiRewritten,
        status: "review",
      },
    },
  );

  return processed;
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