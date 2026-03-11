"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";
import UploadImage from "@/app/admin/components/UploadImage";

type EditorProps = {
  initialArticle: {
    _id: string;
    title: string;
    excerpt?: string;
    content?: string;
    category?: string;
    anime?: string;
    tags?: string[];
    coverImage?: string;
    seo?: {
      metaTitle?: string;
      metaDesc?: string;
      ogImage?: string;
    };
  };
};

export default function Editor({ initialArticle }: EditorProps) {
  const { messages } = useLanguage();
  const [form, setForm] = useState({
    title: initialArticle.title || "",
    excerpt: initialArticle.excerpt || "",
    content: initialArticle.content || "",
    category: initialArticle.category || "",
    anime: initialArticle.anime || "",
    tags: (initialArticle.tags || []).join(", "),
    coverImage: initialArticle.coverImage || "",
    metaTitle: initialArticle.seo?.metaTitle || "",
    metaDesc: initialArticle.seo?.metaDesc || "",
    ogImage: initialArticle.seo?.ogImage || "",
  });
  const [status, setStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef(form);
  const lastSavedRef = useRef(JSON.stringify({
    title: initialArticle.title || "",
    excerpt: initialArticle.excerpt || "",
    content: initialArticle.content || "",
    category: initialArticle.category || "",
    anime: initialArticle.anime || "",
    tags: (initialArticle.tags || []).join(", "),
    coverImage: initialArticle.coverImage || "",
    metaTitle: initialArticle.seo?.metaTitle || "",
    metaDesc: initialArticle.seo?.metaDesc || "",
    ogImage: initialArticle.seo?.ogImage || "",
  }));
  const deferredPreview = useMemo(() => ({
    title: form.metaTitle || form.title || messages.editor.articleTitleFallback,
    description: form.metaDesc || form.excerpt || messages.editor.metaFallback,
    slug: form.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  }), [form.excerpt, form.metaDesc, form.metaTitle, form.title, messages.editor.articleTitleFallback, messages.editor.metaFallback]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  function updateField(name: string, value: string) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      setIsDirty(JSON.stringify(next) !== lastSavedRef.current);
      return next;
    });
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
        title: currentForm.title,
        excerpt: currentForm.excerpt,
        content: currentForm.content,
        category: currentForm.category,
        anime: currentForm.anime,
        tags: currentForm.tags,
        coverImage: currentForm.coverImage,
        seo: {
          metaTitle: currentForm.metaTitle,
          metaDesc: currentForm.metaDesc,
          ogImage: currentForm.ogImage,
        },
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
  }, [initialArticle._id, messages.editor.autoToast, messages.editor.autosaved, messages.editor.autosaving, messages.editor.failedWithReasonPrefix, messages.editor.saveFailed, messages.editor.saved, messages.editor.savedToast, messages.editor.saving, messages.editor.unauthorized]);

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
          {status ? <span className="text-sm text-muted">{status}</span> : null}
        </div>
        <button className="button-primary" onClick={() => void handleSave("manual")} type="button">
          {messages.editor.saveNow}
        </button>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <input
            aria-label={messages.editor.titleAria}
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder={messages.editor.titlePlaceholder}
          />
          <textarea
            aria-label={messages.editor.excerptAria}
            className="min-h-28 w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.excerpt}
            onChange={(event) => updateField("excerpt", event.target.value)}
            placeholder={messages.editor.excerptPlaceholder}
          />
          <textarea
            aria-label={messages.editor.contentAria}
            className="min-h-90 w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.content}
            onChange={(event) => updateField("content", event.target.value)}
            placeholder={messages.editor.contentPlaceholder}
          />
        </div>
        <div className="space-y-5">
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
            placeholder={messages.editor.categoryPlaceholder}
          />
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.anime}
            onChange={(event) => updateField("anime", event.target.value)}
            placeholder={messages.editor.animePlaceholder}
          />
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.tags}
            onChange={(event) => updateField("tags", event.target.value)}
            placeholder={messages.editor.tagsPlaceholder}
          />
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.metaTitle}
            onChange={(event) => updateField("metaTitle", event.target.value)}
            placeholder={messages.editor.metaTitlePlaceholder}
          />
          <textarea
            className="min-h-24 w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.metaDesc}
            onChange={(event) => updateField("metaDesc", event.target.value)}
            placeholder={messages.editor.metaDescPlaceholder}
          />
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.coverImage}
            onChange={(event) => updateField("coverImage", event.target.value)}
            placeholder={messages.editor.coverPlaceholder}
          />
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            value={form.ogImage}
            onChange={(event) => updateField("ogImage", event.target.value)}
            placeholder={messages.editor.ogPlaceholder}
          />
          <UploadImage
            onUploaded={(url) => {
              updateField("coverImage", url);
              updateField("ogImage", url);
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
              <p className="eyebrow">{form.category || messages.editor.categoryFallback}</p>
              <h2 className="font-display text-2xl font-semibold">{form.title || messages.editor.articleTitleFallback}</h2>
              <p className="text-sm leading-7 text-muted">{form.excerpt || messages.editor.excerptPreviewFallback}</p>
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