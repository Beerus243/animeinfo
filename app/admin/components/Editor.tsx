"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";
import UploadImage from "@/app/admin/components/UploadImage";
import { slugify } from "@/lib/slugify";

type EditorLocale = "fr" | "en";

type LocalizedEditorFields = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  seo: {
    metaTitle: string;
    metaDesc: string;
    ogImage: string;
  };
};

type EditorFormState = {
  localizations: Record<EditorLocale, LocalizedEditorFields>;
  category: string;
  anime: string;
  tags: string;
  coverImage: string;
  section: "news" | "recommendation";
  recommendationType: "anime" | "manga";
};

type EditorProps = {
  rewritingEnabled: boolean;
  translationEnabled: boolean;
  initialArticle: {
    _id: string;
    aiRewritten?: boolean;
    slug?: string;
    title: string;
    excerpt?: string;
    content?: string;
    category?: string;
    anime?: string;
    tags?: string[];
    coverImage?: string;
    section?: "news" | "recommendation";
    recommendationType?: "anime" | "manga";
    seo?: {
      metaTitle?: string;
      metaDesc?: string;
      ogImage?: string;
    };
    localizations?: {
      fr?: {
        slug?: string;
        title?: string;
        excerpt?: string;
        content?: string;
        seo?: {
          metaTitle?: string;
          metaDesc?: string;
          ogImage?: string;
        };
      };
      en?: {
        slug?: string;
        title?: string;
        excerpt?: string;
        content?: string;
        seo?: {
          metaTitle?: string;
          metaDesc?: string;
          ogImage?: string;
        };
      };
    };
  };
};

export default function Editor({ initialArticle, rewritingEnabled, translationEnabled }: EditorProps) {
  const { messages } = useLanguage();
  const [activeLocale, setActiveLocale] = useState<EditorLocale>("fr");
  const [aiRewritten, setAiRewritten] = useState(Boolean(initialArticle.aiRewritten));
  const [isRewriting, setIsRewriting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const initialFormState: EditorFormState = {
    localizations: {
      fr: {
        slug: initialArticle.localizations?.fr?.slug || initialArticle.slug || "",
        title: initialArticle.localizations?.fr?.title || initialArticle.title || "",
        excerpt: initialArticle.localizations?.fr?.excerpt || initialArticle.excerpt || "",
        content: initialArticle.localizations?.fr?.content || initialArticle.content || "",
        seo: {
          metaTitle: initialArticle.localizations?.fr?.seo?.metaTitle || initialArticle.seo?.metaTitle || "",
          metaDesc: initialArticle.localizations?.fr?.seo?.metaDesc || initialArticle.seo?.metaDesc || "",
          ogImage: initialArticle.localizations?.fr?.seo?.ogImage || initialArticle.seo?.ogImage || "",
        },
      },
      en: {
        slug: initialArticle.localizations?.en?.slug || "",
        title: initialArticle.localizations?.en?.title || "",
        excerpt: initialArticle.localizations?.en?.excerpt || "",
        content: initialArticle.localizations?.en?.content || "",
        seo: {
          metaTitle: initialArticle.localizations?.en?.seo?.metaTitle || "",
          metaDesc: initialArticle.localizations?.en?.seo?.metaDesc || "",
          ogImage: initialArticle.localizations?.en?.seo?.ogImage || initialArticle.seo?.ogImage || "",
        },
      },
    },
    category: initialArticle.category || "",
    anime: initialArticle.anime || "",
    tags: (initialArticle.tags || []).join(", "),
    coverImage: initialArticle.coverImage || "",
    section: initialArticle.section || "news",
    recommendationType: initialArticle.recommendationType || "anime",
  };
  const [form, setForm] = useState(initialFormState);
  const [status, setStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef(form);
  const lastSavedRef = useRef(JSON.stringify(initialFormState));
  const localizedForm = form.localizations[activeLocale];
  const localeCompletion = useMemo(() => ({
    fr: [form.localizations.fr.title, form.localizations.fr.excerpt, form.localizations.fr.content].filter((value) => value.trim()).length,
    en: [form.localizations.en.title, form.localizations.en.excerpt, form.localizations.en.content].filter((value) => value.trim()).length,
  }), [form.localizations.en.content, form.localizations.en.excerpt, form.localizations.en.title, form.localizations.fr.content, form.localizations.fr.excerpt, form.localizations.fr.title]);
  const deferredPreview = useMemo(() => ({
    title: localizedForm.seo.metaTitle || localizedForm.title || messages.editor.articleTitleFallback,
    description: localizedForm.seo.metaDesc || localizedForm.excerpt || messages.editor.metaFallback,
    slug: (localizedForm.title || form.localizations.fr.title || form.localizations.en.title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  }), [form.localizations.en.title, form.localizations.fr.title, localizedForm.excerpt, localizedForm.seo.metaDesc, localizedForm.seo.metaTitle, localizedForm.title, messages.editor.articleTitleFallback, messages.editor.metaFallback]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  function updateForm(next: EditorFormState) {
    setForm(next);
    setIsDirty(JSON.stringify(next) !== lastSavedRef.current);
  }

  function updateSharedField(name: keyof Omit<EditorFormState, "localizations">, value: string) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      setIsDirty(JSON.stringify(next) !== lastSavedRef.current);
      return next;
    });
  }

  function updateLocalizedField(locale: EditorLocale, field: keyof Omit<LocalizedEditorFields, "seo">, value: string) {
    setForm((current) => {
      const next = {
        ...current,
        localizations: {
          ...current.localizations,
          [locale]: {
            ...current.localizations[locale],
            [field]: value,
          },
        },
      };
      setIsDirty(JSON.stringify(next) !== lastSavedRef.current);
      return next;
    });
  }

  function updateLocalizedSeoField(locale: EditorLocale, field: keyof LocalizedEditorFields["seo"], value: string) {
    setForm((current) => {
      const next = {
        ...current,
        localizations: {
          ...current.localizations,
          [locale]: {
            ...current.localizations[locale],
            seo: {
              ...current.localizations[locale].seo,
              [field]: value,
            },
          },
        },
      };
      setIsDirty(JSON.stringify(next) !== lastSavedRef.current);
      return next;
    });
  }

  function prefillLocaleFrom(sourceLocale: EditorLocale, targetLocale: EditorLocale) {
    const source = formRef.current.localizations[sourceLocale];

    if (![source.title, source.excerpt, source.content, source.seo.metaTitle, source.seo.metaDesc].some((value) => value.trim())) {
      setToast(messages.editor.prefillMissingSource);
      return;
    }

    const nextTargetSlug = source.title.trim() ? slugify(source.title) : formRef.current.localizations[targetLocale].slug;
    updateForm({
      ...formRef.current,
      localizations: {
        ...formRef.current.localizations,
        [targetLocale]: {
          ...formRef.current.localizations[targetLocale],
          slug: nextTargetSlug,
          title: source.title,
          excerpt: source.excerpt,
          content: source.content,
          seo: {
            metaTitle: source.seo.metaTitle,
            metaDesc: source.seo.metaDesc,
            ogImage: source.seo.ogImage,
          },
        },
      },
    });
    setToast(messages.editor.prefillSuccess.replace("{locale}", sourceLocale.toUpperCase()));
  }

  async function autoTranslateFrom(sourceLocale: EditorLocale, targetLocale: EditorLocale) {
    const source = formRef.current.localizations[sourceLocale];

    if (![source.title, source.excerpt, source.content, source.seo.metaTitle, source.seo.metaDesc].some((value) => value.trim())) {
      setToast(messages.editor.prefillMissingSource);
      return;
    }

    setIsTranslating(true);
    setStatus(messages.editor.autoTranslatePending);

    try {
      const response = await fetch("/api/admin/translate-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceLocale,
          targetLocale,
          fields: {
            title: source.title,
            excerpt: source.excerpt,
            content: source.content,
            seo: {
              metaTitle: source.seo.metaTitle,
              metaDesc: source.seo.metaDesc,
            },
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.translation) {
        throw new Error(payload?.error || messages.editor.autoTranslateFailed);
      }

      updateForm({
        ...formRef.current,
        localizations: {
          ...formRef.current.localizations,
          [targetLocale]: {
            ...formRef.current.localizations[targetLocale],
            slug: payload.translation.slug || formRef.current.localizations[targetLocale].slug,
            title: payload.translation.title || "",
            excerpt: payload.translation.excerpt || "",
            content: payload.translation.content || "",
            seo: {
              ...formRef.current.localizations[targetLocale].seo,
              metaTitle: payload.translation.seo?.metaTitle || "",
              metaDesc: payload.translation.seo?.metaDesc || "",
            },
          },
        },
      });
      setStatus(messages.editor.autoTranslateSuccess.replace("{locale}", targetLocale.toUpperCase()));
      setToast(messages.editor.autoTranslateSuccess.replace("{locale}", targetLocale.toUpperCase()));
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : messages.editor.autoTranslateFailed;
      setStatus(message);
      setToast(message);
    } finally {
      setIsTranslating(false);
    }
  }

  async function autoRewriteLocale(locale: EditorLocale) {
    const source = formRef.current.localizations[locale];

    if (![source.title, source.excerpt, source.content, source.seo.metaTitle, source.seo.metaDesc].some((value) => value.trim())) {
      setToast(messages.editor.prefillMissingSource);
      return;
    }

    setIsRewriting(true);
    setStatus(messages.editor.autoRewritePending.replace("{locale}", locale.toUpperCase()));

    try {
      const response = await fetch("/api/admin/rewrite-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale,
          fields: {
            title: source.title,
            excerpt: source.excerpt,
            content: source.content,
            seo: {
              metaTitle: source.seo.metaTitle,
              metaDesc: source.seo.metaDesc,
            },
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.rewrite) {
        throw new Error(payload?.error || messages.editor.autoRewriteFailed);
      }

      updateForm({
        ...formRef.current,
        localizations: {
          ...formRef.current.localizations,
          [locale]: {
            ...formRef.current.localizations[locale],
            slug: payload.rewrite.slug || formRef.current.localizations[locale].slug,
            title: payload.rewrite.title || "",
            excerpt: payload.rewrite.excerpt || "",
            content: payload.rewrite.content || "",
            seo: {
              ...formRef.current.localizations[locale].seo,
              metaTitle: payload.rewrite.seo?.metaTitle || "",
              metaDesc: payload.rewrite.seo?.metaDesc || "",
            },
          },
        },
      });
      setAiRewritten(true);
      setStatus(messages.editor.autoRewriteSuccess.replace("{locale}", locale.toUpperCase()));
      setToast(messages.editor.autoRewriteSuccess.replace("{locale}", locale.toUpperCase()));
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : messages.editor.autoRewriteFailed;
      setStatus(message);
      setToast(message);
    } finally {
      setIsRewriting(false);
    }
  }

  const handleSave = useCallback(async (reason: "manual" | "auto" = "manual") => {
    setStatus(reason === "auto" ? messages.editor.autosaving : messages.editor.saving);
    const currentForm = formRef.current;

    const response = await fetch("/api/admin/save-article", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: initialArticle._id,
        localizations: currentForm.localizations,
        category: currentForm.category,
        anime: currentForm.anime,
        tags: currentForm.tags,
        coverImage: currentForm.coverImage,
        section: currentForm.section,
        recommendationType: currentForm.section === "recommendation" ? currentForm.recommendationType : null,
        aiRewritten,
      }),
    });

    if (response.ok) {
      lastSavedRef.current = JSON.stringify(currentForm);
      setIsDirty(false);
      setStatus(reason === "auto" ? messages.editor.autosaved : messages.editor.saved);
      setToast(reason === "auto" ? messages.editor.autoToast : messages.editor.savedToast);
      return;
    }

    let failureMessage: string = messages.editor.saveFailed;

    try {
      const payload = await response.json();
      if (response.status === 401) {
        failureMessage = messages.editor.unauthorized;
      } else if (payload?.error) {
        failureMessage = `${messages.editor.failedWithReasonPrefix} ${payload.error}`;
      }
    } catch {
      if (response.status === 401) {
        failureMessage = messages.editor.unauthorized;
      }
    }

    setStatus(failureMessage);
    setToast(failureMessage);
  }, [aiRewritten, initialArticle._id, messages.editor.autoToast, messages.editor.autosaved, messages.editor.autosaving, messages.editor.failedWithReasonPrefix, messages.editor.saveFailed, messages.editor.saved, messages.editor.savedToast, messages.editor.saving, messages.editor.unauthorized]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleSave("auto");
    }, 12_000);

    return () => window.clearTimeout(timeoutId);
  }, [form, handleSave, isDirty]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave("manual");
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const confirmed = window.confirm(messages.editor.publishConfirm);
        if (confirmed) {
          document.getElementById("publish-article-button")?.click();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave, messages.editor.publishConfirm]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  return (
    <div className="panel p-6 md:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`status-chip ${isDirty ? "status-chip-warning" : "status-chip-success"}`}>
            {isDirty ? messages.editor.unsaved : messages.editor.upToDate}
          </span>
          {aiRewritten ? <span className="status-chip status-chip-success">{messages.editor.aiRewritten}</span> : null}
          {status ? <span className="text-sm text-muted">{status}</span> : null}
        </div>
        <button className="button-primary" onClick={() => void handleSave("manual")} type="button">
          {messages.editor.saveNow}
        </button>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="content-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">{messages.localeLabel}</p>
                <p className="mt-1 font-medium text-foreground">{messages.locales[activeLocale]}</p>
                <p className="mt-1 text-[13px] text-muted">Le contenu et le SEO se modifient pour la langue active uniquement.</p>
              </div>
              <span className="status-chip status-chip-success">{localeCompletion[activeLocale]}/3</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(["fr", "en"] as const).map((localeOption) => {
                const isActive = activeLocale === localeOption;

                return (
                  <button
                    key={localeOption}
                    className={isActive ? "content-card border-accent bg-accent-soft p-3 text-left" : "content-card p-3 text-left opacity-90"}
                    onClick={() => setActiveLocale(localeOption)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{localeOption.toUpperCase()}</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{messages.locales[localeOption]}</p>
                        <p className="mt-1 text-[12px] text-muted">/{(form.localizations[localeOption].slug || "article").trim() || "article"}</p>
                      </div>
                      <span className={isActive ? "status-chip status-chip-success" : "status-chip status-chip-warning"}>
                        {localeCompletion[localeOption]}/3
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-line bg-white/45 p-3 dark:bg-white/5">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">{messages.editor.rewriteAssistTitle}</p>
              <p className="mt-2 text-[13px] leading-6 text-muted">{messages.editor.rewriteAssistDescription}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="button-primary" disabled={!rewritingEnabled || isRewriting} onClick={() => void autoRewriteLocale(activeLocale)} type="button">
                  {isRewriting
                    ? messages.editor.autoRewritePending.replace("{locale}", activeLocale.toUpperCase())
                    : messages.editor.autoRewriteCurrent.replace("{locale}", activeLocale.toUpperCase())}
                </button>
              </div>
              {!rewritingEnabled ? <p className="mt-3 text-[12px] text-muted">{messages.editor.autoRewriteUnavailable}</p> : null}
            </div>
            <div className="rounded-2xl border border-line bg-white/45 p-3 dark:bg-white/5">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">{messages.editor.translationAssistTitle}</p>
              <p className="mt-2 text-[13px] leading-6 text-muted">{messages.editor.translationAssistDescription}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="button-secondary" onClick={() => prefillLocaleFrom("fr", "en")} type="button">
                  {messages.editor.prefillFromFr}
                </button>
                <button className="button-secondary" onClick={() => prefillLocaleFrom("en", "fr")} type="button">
                  {messages.editor.prefillFromEn}
                </button>
                <button className="button-primary" disabled={!translationEnabled || isTranslating || isRewriting} onClick={() => void autoTranslateFrom("fr", "en")} type="button">
                  {isTranslating ? messages.editor.autoTranslatePending : messages.editor.autoTranslateFromFr}
                </button>
                <button className="button-primary" disabled={!translationEnabled || isTranslating || isRewriting} onClick={() => void autoTranslateFrom("en", "fr")} type="button">
                  {isTranslating ? messages.editor.autoTranslatePending : messages.editor.autoTranslateFromEn}
                </button>
              </div>
              {!translationEnabled ? <p className="mt-3 text-[12px] text-muted">{messages.editor.autoTranslateUnavailable}</p> : null}
            </div>
          </div>
          <input
            aria-label={messages.editor.titleAria}
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={localizedForm.title}
            onChange={(event) => updateLocalizedField(activeLocale, "title", event.target.value)}
            placeholder={`${messages.editor.titlePlaceholder} (${activeLocale.toUpperCase()})`}
          />
          <textarea
            aria-label={messages.editor.excerptAria}
            className="min-h-28 w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={localizedForm.excerpt}
            onChange={(event) => updateLocalizedField(activeLocale, "excerpt", event.target.value)}
            placeholder={`${messages.editor.excerptPlaceholder} (${activeLocale.toUpperCase()})`}
          />
          <textarea
            aria-label={messages.editor.contentAria}
            className="min-h-90 w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={localizedForm.content}
            onChange={(event) => updateLocalizedField(activeLocale, "content", event.target.value)}
            placeholder={`${messages.editor.contentPlaceholder} (${activeLocale.toUpperCase()})`}
          />
        </div>
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-muted">
              <span>{messages.editor.sectionLabel}</span>
              <select
                className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-foreground"
                value={form.section}
                onChange={(event) => updateSharedField("section", event.target.value)}
              >
                <option value="news">{messages.editor.sectionNews}</option>
                <option value="recommendation">{messages.editor.sectionRecommendation}</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-muted">
              <span>{messages.editor.recommendationTypeLabel}</span>
              <select
                className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-foreground"
                disabled={form.section !== "recommendation"}
                value={form.recommendationType}
                onChange={(event) => updateSharedField("recommendationType", event.target.value)}
              >
                <option value="anime">{messages.editor.recommendationTypeAnime}</option>
                <option value="manga">{messages.editor.recommendationTypeManga}</option>
              </select>
            </label>
          </div>
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.category}
            onChange={(event) => updateSharedField("category", event.target.value)}
            placeholder={messages.editor.categoryPlaceholder}
          />
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.anime}
            onChange={(event) => updateSharedField("anime", event.target.value)}
            placeholder={messages.editor.animePlaceholder}
          />
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.tags}
            onChange={(event) => updateSharedField("tags", event.target.value)}
            placeholder={messages.editor.tagsPlaceholder}
          />
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={localizedForm.seo.metaTitle}
            onChange={(event) => updateLocalizedSeoField(activeLocale, "metaTitle", event.target.value)}
            placeholder={`${messages.editor.metaTitlePlaceholder} (${activeLocale.toUpperCase()})`}
          />
          <textarea
            className="min-h-24 w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={localizedForm.seo.metaDesc}
            onChange={(event) => updateLocalizedSeoField(activeLocale, "metaDesc", event.target.value)}
            placeholder={`${messages.editor.metaDescPlaceholder} (${activeLocale.toUpperCase()})`}
          />
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.coverImage}
            onChange={(event) => updateSharedField("coverImage", event.target.value)}
            placeholder={messages.editor.coverPlaceholder}
          />
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={localizedForm.seo.ogImage}
            onChange={(event) => updateLocalizedSeoField(activeLocale, "ogImage", event.target.value)}
            placeholder={`${messages.editor.ogPlaceholder} (${activeLocale.toUpperCase()})`}
          />
          <UploadImage
            onUploaded={(url) => {
              updateForm({
                ...formRef.current,
                coverImage: url,
                localizations: {
                  fr: {
                    ...formRef.current.localizations.fr,
                    seo: {
                      ...formRef.current.localizations.fr.seo,
                      ogImage: url,
                    },
                  },
                  en: {
                    ...formRef.current.localizations.en,
                    seo: {
                      ...formRef.current.localizations.en.seo,
                      ogImage: url,
                    },
                  },
                },
              });
              setToast(messages.editor.imageToast);
            }}
          />
          <div className="rounded-3xl border border-line bg-white/55 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{messages.editor.serpPreview}</p>
            <div className="mt-4 space-y-2">
              <p className="line-clamp-2 text-lg font-semibold text-[#1a0dab] dark:text-[#8ab4f8]">{deferredPreview.title}</p>
              <p className="text-sm text-success">animeinfo.com/article/{deferredPreview.slug || messages.editor.slugFallback}</p>
              <p className="text-sm leading-6 text-muted">{deferredPreview.description}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-white/55 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{messages.editor.livePreview}</p>
            <div className="mt-4 space-y-3">
              <p className="eyebrow">
                {form.section === "recommendation"
                  ? `${messages.editor.sectionRecommendation} · ${form.recommendationType === "manga" ? messages.editor.recommendationTypeManga : messages.editor.recommendationTypeAnime}`
                  : form.category || messages.editor.categoryFallback}
              </p>
              <h2 className="font-display text-2xl font-semibold">{localizedForm.title || messages.editor.articleTitleFallback}</h2>
              <p className="text-sm leading-7 text-muted">{localizedForm.excerpt || messages.editor.excerptPreviewFallback}</p>
            </div>
          </div>
        </div>
      </div>
      {toast ? (
        <div aria-live="polite" className="fixed bottom-4 right-4 z-50 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}