import type { Metadata } from "next";
import Link from "next/link";

import NotificationSignupForm from "@/app/components/NotificationSignupForm";
import { formatDateTime, getMessages } from "@/lib/i18n/messages";
import { getCurrentSeasonLabel } from "@/lib/animeSeason";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { buildCollectionJsonLd, buildMetadata } from "@/lib/seo";
import Anime from "@/models/Anime";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return buildMetadata({
    title: messages.airing.title,
    description: messages.airing.description,
    path: "/airing",
  });
}

export default async function AiringPage() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const currentSeasonLabel = getCurrentSeasonLabel();

  await connectToDatabase();

  const baseFilter = {
    notificationsEnabled: { $ne: false },
    $or: [
      { status: "airing" },
      { currentSeasonLabel },
      { seasons: currentSeasonLabel },
    ],
  };

  const [airingAnimes, popularAiringAnimes] = await Promise.all([
    Anime.find(baseFilter)
      .sort({ nextEpisodeAt: 1, popularityScore: -1, updatedAt: -1 })
      .limit(24)
      .lean(),
    Anime.find(baseFilter)
      .sort({ isPopularNow: -1, popularityScore: -1, nextEpisodeAt: 1, updatedAt: -1 })
      .limit(8)
      .lean(),
  ]);

  const jsonLd = buildCollectionJsonLd({
    title: messages.airing.title,
    description: messages.airing.description,
    path: "/airing",
    itemPaths: airingAnimes.map((anime) => `/anime/${anime.slug}`),
  });

  const notificationOptions = airingAnimes.map((anime) => ({
    slug: anime.slug,
    title: anime.title,
    releaseDay: anime.releaseDay || undefined,
  }));

  return (
    <div className="shell-container py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="panel px-6 py-8 md:px-10 md:py-12">
        <span className="eyebrow">{messages.airing.eyebrow}</span>
        <h1 className="mt-5 font-display text-4xl font-semibold md:text-6xl">{messages.airing.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{messages.airing.description}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted">
          <span className="rounded-full border border-line px-4 py-2">{currentSeasonLabel}</span>
          <span className="rounded-full border border-line px-4 py-2">{airingAnimes.length} {messages.airing.airingCountSuffix}</span>
          <span className="rounded-full border border-line px-4 py-2">{popularAiringAnimes.length} {messages.airing.popularCountSuffix}</span>
        </div>
      </section>

      <div className="mt-8">
        <NotificationSignupForm animeOptions={notificationOptions} sourcePage="/airing" />
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{messages.airing.airingEyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">{messages.airing.airingTitle}</h2>
          </div>
        </div>
        <div className="grid-auto-fit mt-6">
          {airingAnimes.length ? (
            airingAnimes.map((anime) => (
              <Link key={anime._id.toString()} href={`/anime/${anime.slug}`} className="panel p-6 transition-transform hover:-translate-y-0.5">
                <p className="text-sm uppercase tracking-[0.16em] text-muted">{anime.currentSeasonLabel || currentSeasonLabel}</p>
                <h3 className="mt-4 font-display text-3xl font-semibold">{anime.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{anime.synopsis || messages.anime.synopsisFallback}</p>
                <div className="mt-5 flex flex-wrap gap-2 text-sm text-muted">
                  <span className="rounded-full bg-accent-soft px-3 py-2 text-accent">{anime.releaseDay || messages.airing.unknownReleaseDay}</span>
                  {anime.nextEpisodeAt ? (
                    <span className="rounded-full border border-line px-3 py-2">
                      {messages.airing.nextEpisodePrefix} {formatDateTime(locale, anime.nextEpisodeAt)}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))
          ) : (
            <div className="panel p-6 text-muted">{messages.airing.empty}</div>
          )}
        </div>
      </section>

      <section className="mt-8 panel px-6 py-8 md:px-8">
        <p className="eyebrow">{messages.airing.popularEyebrow}</p>
        <h2 className="mt-3 font-display text-3xl font-semibold">{messages.airing.popularTitle}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {popularAiringAnimes.length ? (
            popularAiringAnimes.map((anime, index) => (
              <Link key={anime._id.toString()} href={`/anime/${anime.slug}`} className="rounded-3xl border border-line bg-white/55 p-5 transition-transform hover:-translate-y-0.5">
                <p className="text-sm uppercase tracking-[0.16em] text-muted">Top {index + 1}</p>
                <h3 className="mt-3 font-display text-2xl font-semibold">{anime.title}</h3>
                <p className="mt-2 text-sm text-muted">{messages.airing.popularityPrefix} {anime.popularityScore || 0}</p>
              </Link>
            ))
          ) : (
            <div className="panel p-6 text-muted md:col-span-2 xl:col-span-4">{messages.airing.popularEmpty}</div>
          )}
        </div>
      </section>
    </div>
  );
}