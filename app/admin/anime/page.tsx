import Link from "next/link";

import AdminAnimeActions from "@/app/admin/components/AdminAnimeActions";
import AnimeCard from "@/app/admin/components/AnimeCard";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import Anime from "@/models/Anime";
import NotificationSubscription from "@/models/NotificationSubscription";
import WebPushSubscription from "@/models/WebPushSubscription";

export const dynamic = "force-dynamic";

type AdminAnimePageProps = {
  searchParams?: Promise<{ filter?: string }>;
};

export default async function AdminAnimePage({ searchParams }: AdminAnimePageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const resolved = searchParams ? await searchParams : undefined;
  const filter = resolved?.filter === "popular" ? "popular" : resolved?.filter === "airing" ? "airing" : "all";

  await connectToDatabase();

  const hideLegacyAiring = (await Anime.countDocuments({ status: "airing", tags: "icotaku" })) > 0;

  const visibleAnimeQuery = hideLegacyAiring
    ? {
        $or: [
          { status: { $ne: "airing" } },
          { status: "airing", tags: "icotaku" },
        ],
      }
    : {};

  const query = filter === "popular"
    ? {
        isPopularNow: true,
        ...visibleAnimeQuery,
      }
    : filter === "airing"
      ? hideLegacyAiring
        ? { status: "airing", tags: "icotaku" }
        : { status: "airing" }
      : visibleAnimeQuery;
  const [animes, emailSubscriptionCount, pushSubscriptionCount] = await Promise.all([
    Anime.find(query).sort({ isPopularNow: -1, popularityScore: -1, updatedAt: -1 }).lean(),
    NotificationSubscription.countDocuments({ active: true }),
    WebPushSubscription.countDocuments({ active: true }),
  ]);

  return (
    <div className="shell-container py-8 md:py-12">
      <section className="panel px-5 py-6 md:px-10 md:py-12">
        <span className="eyebrow">{messages.adminAnime.eyebrow}</span>
        <h1 className="mt-4 font-display text-3xl font-semibold md:mt-5 md:text-5xl">{messages.adminAnime.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted md:leading-7">{messages.adminAnime.description}</p>
        <div className="mt-6 flex flex-wrap gap-2.5 md:gap-3">
          <Link className={filter === "all" ? "button-primary" : "button-secondary"} href="/admin/anime">{messages.adminAnime.filterAll}</Link>
          <Link className={filter === "airing" ? "button-primary" : "button-secondary"} href="/admin/anime?filter=airing">{messages.adminAnime.filterAiring}</Link>
          <Link className={filter === "popular" ? "button-primary" : "button-secondary"} href="/admin/anime?filter=popular">{messages.adminAnime.filterPopular}</Link>
        </div>
        <div className="mt-6 flex flex-wrap items-start gap-2.5 md:gap-3">
          <AdminAnimeActions />
          <span className="rounded-full border border-line px-3 py-2 text-sm text-muted">{emailSubscriptionCount + pushSubscriptionCount} {messages.adminAnime.subscriptions}</span>
        </div>
      </section>

      {animes.length ? (
        <div className="grid-auto-fit mt-8">
          {animes.map((anime) => (
            <AnimeCard
              key={anime._id.toString()}
              anime={{
                id: anime._id.toString(),
                title: anime.title,
                status: anime.status ?? undefined,
                currentSeasonLabel: anime.currentSeasonLabel ?? undefined,
                popularityScore: anime.popularityScore ?? undefined,
                isPopularNow: anime.isPopularNow ?? undefined,
                notificationsEnabled: anime.notificationsEnabled ?? undefined,
                tags: anime.tags ?? undefined,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="panel mt-8 p-6 text-muted">{messages.adminAnime.empty}</div>
      )}
    </div>
  );
}