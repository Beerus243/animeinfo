import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ArticleCard from "@/app/components/ArticleCard";
import NotificationSignupForm from "@/app/components/NotificationSignupForm";
import { resolveArticleLocalization } from "@/lib/articleLocalization";
import { formatDateTime, getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { buildCollectionJsonLd, buildMetadata } from "@/lib/seo";
import Anime from "@/models/Anime";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type AnimePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: AnimePageProps): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { slug } = await params;

  await connectToDatabase();
  const anime = await Anime.findOne({ slug }).lean();

  if (!anime) {
    return buildMetadata({
      title: slug,
      description: messages.anime.synopsisFallback,
      path: `/anime/${slug}`,
    });
  }

  return buildMetadata({
    title: anime.title,
    description: anime.synopsis || messages.anime.synopsisFallback,
    path: `/anime/${slug}`,
    image: anime.coverImage || undefined,
  });
}

export default async function AnimePage({ params }: AnimePageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { slug } = await params;
  await connectToDatabase();

  const [anime, articles] = await Promise.all([
    Anime.findOne({ slug }).lean(),
    Article.find({ anime: slug, status: "published" }).sort({ publishedAt: -1 }).limit(6).lean(),
  ]);

  if (!anime) {
    notFound();
  }

  const jsonLd = buildCollectionJsonLd({
    title: anime.title,
    description: anime.synopsis || messages.anime.synopsisFallback,
    path: `/anime/${slug}`,
    itemPaths: articles.map((article) => `/article/${article.slug}`),
  });

  return (
    <div className="shell-container py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="panel px-6 py-8 md:px-10 md:py-12">
        <span className="eyebrow">{messages.anime.eyebrow}</span>
        <h1 className="mt-5 font-display text-4xl font-semibold md:text-6xl">
          {anime.title}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{anime.synopsis || messages.anime.synopsisFallback}</p>
        <div className="mt-6 flex flex-wrap gap-2 text-sm text-muted">
          {anime.status ? <span className="rounded-full border border-line px-3 py-2">{messages.anime[`status_${anime.status}` as keyof typeof messages.anime] || anime.status}</span> : null}
          {anime.currentSeasonLabel ? <span className="rounded-full border border-line px-3 py-2">{anime.currentSeasonLabel}</span> : null}
          {anime.releaseDay ? <span className="rounded-full border border-line px-3 py-2">{anime.releaseDay}</span> : null}
          {anime.nextEpisodeAt ? (
            <span className="rounded-full border border-line px-3 py-2">
              {messages.anime.nextEpisodePrefix} {formatDateTime(locale, anime.nextEpisodeAt)}
            </span>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {(anime.genres || []).map((genre) => (
            <span key={genre} className="rounded-full bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
              {genre}
            </span>
          ))}
        </div>
      </section>
      {anime.notificationsEnabled !== false && (anime.status === "airing" || anime.currentSeasonLabel) ? (
        <section className="mt-8">
          <NotificationSignupForm
            animeOptions={[{ slug: anime.slug, title: anime.title, releaseDay: anime.releaseDay || undefined }]}
            compact
            locale={locale}
            messages={messages.notifications}
            preselectedSlugs={[anime.slug]}
            sourcePage={`/anime/${anime.slug}`}
          />
        </section>
      ) : null}
      <section className="mt-8">
        <h2 className="font-display text-3xl font-semibold">{messages.anime.related}</h2>
        <div className="grid-auto-fit mt-6">
          {articles.map((article) => (
            <ArticleCard
              key={article._id.toString()}
              article={{
                  title: resolveArticleLocalization(article, locale).title || article.title,
                  slug: resolveArticleLocalization(article, locale).slug || article.slug,
                  excerpt: resolveArticleLocalization(article, locale).excerpt ?? undefined,
                category: article.category ?? undefined,
                coverImage: article.coverImage ?? undefined,
                publishedAt: article.publishedAt ?? undefined,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}