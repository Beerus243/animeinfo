import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import NotificationSignupForm from "@/app/components/NotificationSignupForm";
import CrossLinks from "@/app/components/CrossLinks";
import airingHeroCover from "@/assets/images/steel-ball-run-3840x2160-25586.jpg";
import { getPreferredAiringFilter } from "@/lib/airingAnime";
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
  const baseFilter = await getPreferredAiringFilter();

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
    coverImage: anime.coverImage || undefined,
  }));
  const getFallbackLetter = (title: string) => title.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="shell-container py-6 md:py-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="panel airing-hero overflow-hidden px-5 py-6 md:px-8 md:py-8">
        <div className="airing-hero-media-layer" aria-hidden="true">
          <Image
            alt=""
            className="h-full w-full object-cover"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1080px"
            src={airingHeroCover}
          />
        </div>
        <div className="airing-hero-overlay" aria-hidden="true" />
        <div className="airing-hero-content relative">
          <span className="eyebrow">{messages.airing.eyebrow}</span>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold md:text-5xl">{messages.airing.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted md:text-base md:leading-7">{messages.airing.description}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="airing-hero-stat">
              <p className="airing-hero-stat-label">{messages.airing.seasonStatLabel}</p>
              <p className="airing-hero-stat-value">{currentSeasonLabel}</p>
            </div>
            <div className="airing-hero-stat">
              <p className="airing-hero-stat-label">{messages.airing.airingStatLabel}</p>
              <p className="airing-hero-stat-value">{airingAnimes.length}</p>
              <p className="airing-hero-stat-meta">{messages.airing.airingCountSuffix}</p>
            </div>
            <div className="airing-hero-stat">
              <p className="airing-hero-stat-label">{messages.airing.popularStatLabel}</p>
              <p className="airing-hero-stat-value">{popularAiringAnimes.length}</p>
              <p className="airing-hero-stat-meta">{messages.airing.popularCountSuffix}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 md:mt-8">
        <NotificationSignupForm animeOptions={notificationOptions} locale={locale} maxVisible={24} messages={messages.notifications} sourcePage="/airing" />
      </div>

      <section className="mt-6 md:mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{messages.airing.airingEyebrow}</p>
            <h2 className="mt-2.5 font-display text-2xl font-semibold md:text-[1.7rem]">{messages.airing.airingTitle}</h2>
          </div>
        </div>
        <div className="grid-auto-fit mt-5 md:mt-6">
          {airingAnimes.length ? (
            airingAnimes.map((anime) => (
              <Link key={anime._id.toString()} href={`/anime/${anime.slug}`} className="content-card overflow-hidden p-4 transition-transform hover:-translate-y-0.5">
                <div className="airing-card-media airing-card-media-shell -mx-4 -mt-4 mb-4 overflow-hidden border-b border-line/70">
                  {anime.coverImage ? (
                    <Image
                      alt={anime.title}
                      className="h-full w-full object-cover"
                      height={420}
                      src={anime.coverImage}
                      width={760}
                    />
                  ) : (
                    <div className="airing-card-placeholder">
                      <span className="airing-card-placeholder-mark">{getFallbackLetter(anime.title)}</span>
                      <span className="airing-card-placeholder-title">{anime.title}</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{anime.currentSeasonLabel || currentSeasonLabel}</p>
                <h3 className="mt-3 font-display text-2xl font-semibold md:text-[1.65rem]">{anime.title}</h3>
                <p className="mt-2.5 text-[13px] leading-6 text-muted md:text-sm">{anime.synopsis || messages.anime.synopsisFallback}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[13px] text-muted md:text-sm">
                  <span className="rounded-full bg-accent-soft px-2.5 py-1.5 text-accent">{anime.releaseDay || messages.airing.unknownReleaseDay}</span>
                  {anime.nextEpisodeAt ? (
                    <span className="rounded-full border border-line px-2.5 py-1.5">
                      {messages.airing.nextEpisodePrefix} {formatDateTime(locale, anime.nextEpisodeAt)}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))
          ) : (
            <div className="panel p-5 text-sm text-muted">{messages.airing.empty}</div>
          )}
        </div>
      </section>

      <section className="mt-6 panel px-5 py-6 md:mt-8 md:px-6 md:py-7">
        <p className="eyebrow">{messages.airing.popularEyebrow}</p>
        <h2 className="mt-2.5 font-display text-2xl font-semibold md:text-[1.7rem]">{messages.airing.popularTitle}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {popularAiringAnimes.length ? (
            popularAiringAnimes.map((anime, index) => (
              <Link key={anime._id.toString()} href={`/anime/${anime.slug}`} className="content-card airing-popular-card overflow-hidden p-3.5 transition-transform hover:-translate-y-0.5">
                <div className="airing-card-media airing-card-media-compact airing-card-media-shell airing-popular-card-media -mx-3.5 -mt-3.5 mb-3 overflow-hidden border-b border-line/70">
                  {anime.coverImage ? (
                    <Image
                      alt={anime.title}
                      className="h-full w-full object-cover"
                      height={220}
                      src={anime.coverImage}
                      width={420}
                    />
                  ) : (
                    <div className="airing-card-placeholder">
                      <span className="airing-card-placeholder-mark">{getFallbackLetter(anime.title)}</span>
                      <span className="airing-card-placeholder-title">{anime.title}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Top {index + 1}</p>
                <h3 className="mt-1.5 font-display text-lg font-semibold leading-tight">{anime.title}</h3>
                <p className="mt-1 text-[12px] text-muted">{messages.airing.popularityPrefix} {anime.popularityScore || 0}</p>
              </Link>
            ))
          ) : (
            <div className="panel p-5 text-sm text-muted md:col-span-2 xl:col-span-4">{messages.airing.popularEmpty}</div>
          )}
        </div>
      </section>
      <CrossLinks messages={messages.crossLinks} exclude={["/airing"]} />
    </div>
  );
}