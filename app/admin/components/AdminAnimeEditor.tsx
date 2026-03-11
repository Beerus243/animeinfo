"use client";

import { useState } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

type AdminAnimeEditorProps = {
  initialAnime: {
    _id: string;
    title: string;
    slug: string;
    synopsis?: string;
    coverImage?: string;
    genres?: string[];
    tags?: string[];
    seasons?: string[];
    status?: "upcoming" | "airing" | "completed" | "hiatus";
    currentSeasonLabel?: string;
    releaseDay?: string;
    nextEpisodeAt?: string;
    popularityScore?: number;
    isPopularNow?: boolean;
    notificationsEnabled?: boolean;
  };
};

export default function AdminAnimeEditor({ initialAnime }: AdminAnimeEditorProps) {
  const { messages } = useLanguage();
  const [form, setForm] = useState({
    title: initialAnime.title || "",
    slug: initialAnime.slug || "",
    synopsis: initialAnime.synopsis || "",
    coverImage: initialAnime.coverImage || "",
    genres: (initialAnime.genres || []).join(", "),
    tags: (initialAnime.tags || []).join(", "),
    seasons: (initialAnime.seasons || []).join(", "),
    status: initialAnime.status || "upcoming",
    currentSeasonLabel: initialAnime.currentSeasonLabel || "",
    releaseDay: initialAnime.releaseDay || "",
    nextEpisodeAt: initialAnime.nextEpisodeAt ? initialAnime.nextEpisodeAt.slice(0, 16) : "",
    popularityScore: String(initialAnime.popularityScore || 0),
    isPopularNow: Boolean(initialAnime.isPopularNow),
    notificationsEnabled: initialAnime.notificationsEnabled !== false,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function updateField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSave() {
    setPending(true);
    setStatus(null);

    const response = await fetch("/api/admin/save-anime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: initialAnime._id, ...form }),
    });

    setPending(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setStatus(payload?.error || messages.adminAnime.saveFailed);
      return;
    }

    setStatus(messages.adminAnime.saved);
  }

  return (
    <div className="panel p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <span className="eyebrow">{messages.adminAnime.editorEyebrow}</span>
          <h1 className="mt-4 font-display text-4xl font-semibold">{messages.adminAnime.editorTitle}</h1>
        </div>
        <button className="button-primary" disabled={pending} onClick={handleSave} type="button">
          {pending ? messages.adminAnime.saving : messages.adminAnime.save}
        </button>
      </div>
      {status ? <p className="mb-5 text-sm text-muted">{status}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <input className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3" value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder={messages.adminAnime.titlePlaceholder} />
          <textarea className="min-h-40 w-full rounded-2xl border border-line bg-white/70 px-4 py-3" value={form.synopsis} onChange={(event) => updateField("synopsis", event.target.value)} placeholder={messages.adminAnime.synopsisPlaceholder} />
          <input className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3" value={form.coverImage} onChange={(event) => updateField("coverImage", event.target.value)} placeholder={messages.adminAnime.coverPlaceholder} />
          <input className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3" value={form.genres} onChange={(event) => updateField("genres", event.target.value)} placeholder={messages.adminAnime.genresPlaceholder} />
          <input className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3" value={form.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder={messages.adminAnime.tagsPlaceholder} />
        </div>
        <div className="space-y-5">
          <input className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3" value={form.slug} onChange={(event) => updateField("slug", event.target.value)} placeholder={messages.adminAnime.slugPlaceholder} />
          <input className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3" value={form.seasons} onChange={(event) => updateField("seasons", event.target.value)} placeholder={messages.adminAnime.seasonsPlaceholder} />
          <select className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-foreground" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
            <option value="upcoming">{messages.adminAnime.statusUpcoming}</option>
            <option value="airing">{messages.adminAnime.statusAiring}</option>
            <option value="completed">{messages.adminAnime.statusCompleted}</option>
            <option value="hiatus">{messages.adminAnime.statusHiatus}</option>
          </select>
          <input className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3" value={form.currentSeasonLabel} onChange={(event) => updateField("currentSeasonLabel", event.target.value)} placeholder={messages.adminAnime.currentSeasonPlaceholder} />
          <input className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3" value={form.releaseDay} onChange={(event) => updateField("releaseDay", event.target.value)} placeholder={messages.adminAnime.releaseDayPlaceholder} />
          <input className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3" value={form.nextEpisodeAt} onChange={(event) => updateField("nextEpisodeAt", event.target.value)} type="datetime-local" />
          <input className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3" value={form.popularityScore} onChange={(event) => updateField("popularityScore", event.target.value)} placeholder={messages.adminAnime.popularityPlaceholder} type="number" />
          <label className="flex items-center gap-3 rounded-2xl border border-line bg-white/55 px-4 py-3">
            <input checked={form.isPopularNow} onChange={(event) => updateField("isPopularNow", event.target.checked)} type="checkbox" />
            <span>{messages.adminAnime.isPopularLabel}</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-line bg-white/55 px-4 py-3">
            <input checked={form.notificationsEnabled} onChange={(event) => updateField("notificationsEnabled", event.target.checked)} type="checkbox" />
            <span>{messages.adminAnime.notificationsLabel}</span>
          </label>
        </div>
      </div>
    </div>
  );
}