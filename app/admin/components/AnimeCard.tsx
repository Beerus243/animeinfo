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
    <article className="content-card p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-muted md:text-xs">
        <span className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent">{anime.status || "anime"}</span>
        <span>{anime.currentSeasonLabel || "-"}</span>
      </div>
      <h2 className="mt-3 font-display text-xl font-semibold md:mt-4 md:text-2xl">{anime.title}</h2>
      <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted">
        <span className="rounded-full border border-line px-3 py-2">Popularity {anime.popularityScore || 0}</span>
        {anime.isPopularNow ? <span className="rounded-full bg-accent-soft px-3 py-2 font-medium text-accent">Popular</span> : null}
        <span className="rounded-full border border-line px-3 py-2">{anime.notificationsEnabled === false ? "Notifications off" : "Notifications on"}</span>
      </div>
      <div className="mt-5 flex justify-end md:mt-6">
        <Link className="button-secondary min-h-10 px-4 py-2 text-sm font-semibold" href={`/admin/anime/${anime.id}`}>
          Editer
        </Link>
      </div>
    </article>
  );
}