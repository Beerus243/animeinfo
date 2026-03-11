"use client";

import { useMemo, useState } from "react";

import type { Locale, Messages } from "@/lib/i18n/messages";

type AnimeOption = {
  slug: string;
  title: string;
  releaseDay?: string;
};

type NotificationSignupFormProps = {
  animeOptions: AnimeOption[];
  locale: Locale;
  messages: Messages["notifications"];
  sourcePage: string;
  preselectedSlugs?: string[];
  compact?: boolean;
};

export default function NotificationSignupForm({
  animeOptions,
  locale,
  messages,
  sourcePage,
  preselectedSlugs = [],
  compact = false,
}: NotificationSignupFormProps) {
  const [email, setEmail] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(preselectedSlugs);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const selectedCount = selectedSlugs.length;
  const visibleOptions = useMemo(() => animeOptions.slice(0, compact ? 1 : 8), [animeOptions, compact]);

  function toggleAnime(slug: string) {
    setSelectedSlugs((current) =>
      current.includes(slug) ? current.filter((value) => value !== slug) : [...current, slug],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);

    try {
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          animeSlugs: selectedSlugs,
          locale,
          sourcePage,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus({ type: "error", message: payload?.error || messages.error });
        setPending(false);
        return;
      }

      setStatus({
        type: "success",
        message: messages.success.replace("{count}", String(payload?.count || selectedCount)),
      });
      setPending(false);
    } catch {
      setStatus({ type: "error", message: messages.error });
      setPending(false);
    }
  }

  if (!animeOptions.length) {
    return null;
  }

  return (
    <form className="panel p-6 md:p-8" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">{messages.eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl font-semibold">{messages.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{messages.description}</p>
        </div>
        <span className="status-chip status-chip-success">{selectedCount} {messages.selectedSuffix}</span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3">
          {visibleOptions.map((anime) => {
            const checked = selectedSlugs.includes(anime.slug);

            return (
              <label
                key={anime.slug}
                className={`content-card rounded-3xl px-4 py-4 transition-colors ${checked ? "border-accent bg-accent-soft" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    checked={checked}
                    className="mt-1"
                    onChange={() => toggleAnime(anime.slug)}
                    type="checkbox"
                    value={anime.slug}
                  />
                  <div>
                    <p className="font-semibold">{anime.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {anime.releaseDay ? `${messages.releaseDayPrefix} ${anime.releaseDay}` : messages.releaseFallback}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="content-card space-y-4 rounded-3xl p-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium">{messages.emailLabel}</span>
            <input
              className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 dark:bg-white/5"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={messages.emailPlaceholder}
              type="email"
              value={email}
            />
          </label>
          <button className="button-primary w-full" disabled={pending || selectedCount === 0} type="submit">
            {pending ? messages.pending : messages.submit}
          </button>
          <p className="text-sm leading-7 text-muted">{messages.legalHint}</p>
          {status ? (
            <p className={`text-sm ${status.type === "success" ? "text-success" : "text-warning"}`}>{status.message}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}