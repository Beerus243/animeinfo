import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ArticleCard from "@/app/components/ArticleCard";
import { getMessages } from "@/lib/i18n/messages";
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
        <div className="mt-6 flex flex-wrap gap-2">
          {(anime.genres || []).map((genre) => (
            <span key={genre} className="rounded-full bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
              {genre}
            </span>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-3xl font-semibold">{messages.anime.related}</h2>
        <div className="grid-auto-fit mt-6">
          {articles.map((article) => (
            <ArticleCard
              key={article._id.toString()}
              article={{
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt ?? undefined,
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