import Image from "next/image";
import Link from "next/link";

import AdUnit from "@/app/components/AdUnit";
import ArticleCard from "@/app/components/ArticleCard";
import NotificationSignupForm from "@/app/components/NotificationSignupForm";
import { getPreferredAiringFilter } from "@/lib/airingAnime";
import { resolveArticleLocalization } from "@/lib/articleLocalization";
import { ensureArticlesLocalization } from "@/lib/articleTranslation";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import Anime from "@/models/Anime";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

async function getHomepageArticles() {
  await connectToDatabase();
  const airingFilter = await getPreferredAiringFilter();

  const [featured, latest, airingAnimes] = await Promise.all([
    Article.find({ status: "published" }).sort({ publishedAt: -1, updatedAt: -1 }).limit(1).lean(),
    Article.find({ status: "published" }).sort({ publishedAt: -1, updatedAt: -1 }).limit(6).lean(),
    Anime.find(airingFilter)
      .sort({ isPopularNow: -1, popularityScore: -1, nextEpisodeAt: 1, updatedAt: -1 })
      .limit(4)
      .lean(),
  ]);

  return {
    featured: featured[0] || null,
    latest,
    airingAnimes,
  };
}

export default async function Home() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { featured, latest, airingAnimes } = await getHomepageArticles();
  const [localizedFeaturedItems, localizedLatest] = await Promise.all([
    featured ? ensureArticlesLocalization([featured], locale) : Promise.resolve([]),
    ensureArticlesLocalization(latest, locale),
  ]);
  const resolvedFeatured = localizedFeaturedItems[0] || featured;
  const featuredContent = resolvedFeatured ? resolveArticleLocalization(resolvedFeatured, locale) : null;

  const notificationOptions = airingAnimes.map((anime) => ({
    slug: anime.slug,
    title: anime.title,
    releaseDay: anime.releaseDay ?? undefined,
  }));
  const getFallbackLetter = (title: string) => title.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="shell-container py-6 md:py-10">
      <section className="panel grid gap-6 overflow-hidden px-5 py-6 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-9">
        <div className="space-y-5">
          <span className="eyebrow">{messages.home.eyebrow}</span>
          <div className="space-y-3">
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-tight md:text-6xl">
              {messages.home.title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted md:text-[17px]">
              {messages.home.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link className="button-primary" href="/articles">
              {messages.home.browse}
            </Link>
            <Link className="button-secondary" href="/trending">
              {messages.home.exploreTrending}
            </Link>
          </div>
        </div>
        <div className="panel home-featured-card relative overflow-hidden p-5 md:p-6">
          {resolvedFeatured?.coverImage ? (
            <div className="home-featured-media-layer" aria-hidden="true">
              <Image
                alt=""
                className="h-full w-full object-cover"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 40vw"
                src={resolvedFeatured.coverImage}
              />
            </div>
          ) : null}
          <div className="home-featured-overlay" aria-hidden="true" />
          <div className="home-featured-content">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted">{messages.home.featured}</p>
            {resolvedFeatured ? (
              <div className="mt-3.5 space-y-3.5">
                <span className="home-featured-category-badge">
                  {resolvedFeatured.category || messages.home.industry}
                </span>
                <h2 className="font-display text-2xl font-semibold leading-[1.04] tracking-[-0.03em] md:text-[1.95rem]">
                  {featuredContent?.title || resolvedFeatured.title}
                </h2>
                <p className="text-sm leading-6 text-muted md:text-[15px]">{featuredContent?.excerpt || messages.home.noSummary}</p>
                <Link className="button-primary" href={`/article/${featuredContent?.slug || resolvedFeatured.slug}`}>
                  {messages.home.readArticle}
                </Link>
              </div>
            ) : (
              <div className="mt-3.5 space-y-3.5">
                <h2 className="font-display text-2xl font-semibold leading-[1.04] tracking-[-0.03em] md:text-[1.95rem]">
                  {messages.home.waitingTitle}
                </h2>
                <p className="text-sm leading-6 text-muted md:text-[15px]">
                  {messages.home.waitingDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {notificationOptions.length ? (
        <section className="mt-6 space-y-3.5 md:mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{messages.home.subscribeEyebrow}</p>
              <h2 className="mt-2.5 font-display text-2xl font-semibold md:text-[1.7rem]">{messages.home.subscribeTitle}</h2>
              <p className="mt-2.5 max-w-2xl text-[13px] leading-6 text-muted md:text-sm">{messages.home.subscribeDescription}</p>
            </div>
            <Link className="button-secondary" href="/airing">
              {messages.home.subscribeSecondaryCta}
            </Link>
          </div>
          <NotificationSignupForm
            animeOptions={notificationOptions}
            locale={locale}
            messages={messages.notifications}
            preselectedSlugs={notificationOptions.slice(0, 2).map((anime) => anime.slug)}
            sourcePage="/"
          />
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 md:mt-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{messages.home.latestEyebrow}</p>
              <h2 className="mt-2.5 font-display text-2xl font-semibold md:text-[1.7rem]">
                {messages.home.latestTitle}
              </h2>
            </div>
            <Link className="text-sm font-semibold text-accent" href="/articles">
              {messages.home.viewAll}
            </Link>
          </div>
          <div className="grid-auto-fit">
            {localizedLatest.length ? (
              localizedLatest.map((article) => (
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
              ))
            ) : (
              <div className="panel p-5 text-sm text-muted">
                {messages.home.noArticles}
              </div>
            )}
          </div>
        </div>
        <aside className="space-y-5">
          <AdUnit slot="header" />
          {airingAnimes.length ? (
            <div className="panel p-5 md:p-6">
              <p className="eyebrow">{messages.airing.airingEyebrow}</p>
              <div className="mt-4 space-y-3.5">
                {airingAnimes.map((anime) => (
                  <Link key={anime._id.toString()} href={`/anime/${anime.slug}`} className="airing-mini-card">
                    {anime.coverImage ? (
                      <div className="airing-mini-card-media overflow-hidden">
                        <Image alt={anime.title} className="h-full w-full object-cover" height={132} src={anime.coverImage} width={132} />
                      </div>
                    ) : (
                      <div className="airing-mini-card-media airing-mini-card-fallback" aria-hidden="true">
                        {getFallbackLetter(anime.title)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{anime.title}</p>
                      <p className="mt-1 text-[12px] leading-5 text-muted">{anime.releaseDay ?? messages.airing.unknownReleaseDay}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          <div className="panel p-5 md:p-6">
            <p className="eyebrow">{messages.home.seoEyebrow}</p>
            <h3 className="mt-3 font-display text-xl font-semibold md:text-2xl">
              {messages.home.seoTitle}
            </h3>
            <p className="mt-2.5 text-[13px] leading-6 text-muted md:text-sm">
              {messages.home.seoDescription}
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
