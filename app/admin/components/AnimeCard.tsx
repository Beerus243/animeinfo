"use client";

import Link from "next/link";

type AnimeCardProps = {
  anime: {
    id: string;
    title: string;
    status?: string;
    currentSeasonLabel?: string;
    popularityScore?: number;
    isPopularNow?: boolean;
    notificationsEnabled?: boolean;
  };
};

export default function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <article className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-muted">
        <span>{anime.status || "anime"}</span>
        <span>{anime.currentSeasonLabel || "-"}</span>
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold">{anime.title}</h2>
      <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted">
        <span className="rounded-full border border-line px-3 py-2">Popularity {anime.popularityScore || 0}</span>
        {anime.isPopularNow ? <span className="rounded-full bg-accent-soft px-3 py-2 text-accent">Popular</span> : null}
        <span className="rounded-full border border-line px-3 py-2">{anime.notificationsEnabled === false ? "Notifications off" : "Notifications on"}</span>
      </div>
      <div className="mt-6 flex justify-end">
        <Link className="button-secondary min-h-10 px-4 py-2 text-sm font-semibold" href={`/admin/anime/${anime.id}`}>
          Editer
        </Link>
      </div>
    </article>
  );
}