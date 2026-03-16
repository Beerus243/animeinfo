"use client";

import { FC } from "react";

interface SeoPanelProps {
  title: string;
  content: string;
  metaTitle: string;
  metaDesc: string;
  ogImage: string;
  coverImage: string;
  slug: string;
  onChange: (fields: Partial<{ metaTitle: string; metaDesc: string; ogImage: string; slug: string }>) => void;
}

function autoSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function autoMetaDesc(content: string) {
  const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.slice(0, 150);
}

const SeoPanel: FC<SeoPanelProps> = ({ title, content, metaTitle, metaDesc, ogImage, coverImage, slug, onChange }) => {
  const suggestedSlug = autoSlug(title);
  const suggestedDesc = autoMetaDesc(content);
  const suggestedOg = ogImage || coverImage;

  function autoFill() {
    onChange({
      ...(slug ? {} : { slug: suggestedSlug }),
      ...(metaTitle ? {} : { metaTitle: title }),
      ...(metaDesc ? {} : { metaDesc: suggestedDesc }),
      ...(ogImage ? {} : { ogImage: coverImage }),
    });
  }

  function forceAutoFill() {
    onChange({
      slug: suggestedSlug,
      metaTitle: title,
      metaDesc: suggestedDesc,
      ogImage: coverImage || ogImage,
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-white/50 p-4 dark:bg-white/5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">SEO</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={autoFill}
            className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted hover:bg-accent-soft"
            title="Remplit uniquement les champs vides"
          >
            Auto-remplir vides
          </button>
          <button
            type="button"
            onClick={forceAutoFill}
            className="rounded-full border border-accent px-2 py-0.5 text-[11px] text-accent hover:bg-accent-soft"
            title="Régénère tous les champs SEO depuis le titre et contenu"
          >
            ↺ Tout régénérer
          </button>
        </div>
      </div>
      <div className="grid gap-2">
        <div className="space-y-1">
          <label className="text-[11px] text-muted">Slug</label>
          <div className="flex gap-1">
            <input
              className="w-full rounded-xl border border-line bg-white/70 px-3 py-2 text-sm dark:bg-white/10 dark:text-foreground"
              value={slug}
              onChange={e => onChange({ slug: e.target.value })}
              placeholder={suggestedSlug || "slug-article"}
            />
            {suggestedSlug && slug !== suggestedSlug && (
              <button
                type="button"
                className="shrink-0 rounded-xl border border-line px-2 text-xs text-muted hover:bg-accent-soft"
                onClick={() => onChange({ slug: suggestedSlug })}
              >
                ↺
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted">Meta title</label>
          <input
            className="w-full rounded-xl border border-line bg-white/70 px-3 py-2 text-sm dark:bg-white/10 dark:text-foreground"
            value={metaTitle}
            onChange={e => onChange({ metaTitle: e.target.value })}
            placeholder={title || "Meta title"}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted">
            Meta description
            <span className={`ml-2 ${metaDesc.length > 150 ? "text-red-500" : "text-muted"}`}>{metaDesc.length}/160</span>
          </label>
          <div className="flex gap-1">
            <textarea
              className="w-full rounded-xl border border-line bg-white/70 px-3 py-2 text-sm dark:bg-white/10 dark:text-foreground"
              rows={2}
              value={metaDesc}
              onChange={e => onChange({ metaDesc: e.target.value })}
              placeholder={suggestedDesc || "Meta description de l'article..."}
            />
            {suggestedDesc && metaDesc !== suggestedDesc && (
              <button
                type="button"
                className="shrink-0 self-start rounded-xl border border-line px-2 py-2 text-xs text-muted hover:bg-accent-soft"
                onClick={() => onChange({ metaDesc: suggestedDesc })}
              >
                ↺
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted">OG Image</label>
          <input
            className="w-full rounded-xl border border-line bg-white/70 px-3 py-2 text-sm dark:bg-white/10 dark:text-foreground"
            value={suggestedOg}
            onChange={e => onChange({ ogImage: e.target.value })}
            placeholder="URL de l'image OG (auto: cover)"
          />
        </div>
      </div>
    </div>
  );
};

export default SeoPanel;
