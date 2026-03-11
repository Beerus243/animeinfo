import type { Metadata } from "next";
import Link from "next/link";

import { formatDate, getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { buildCollectionJsonLd, buildMetadata } from "@/lib/seo";
import Anime from "@/models/Anime";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type CategoryRow = {
  _id: string;
  count: number;
  latestPublishedAt?: Date;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return buildMetadata({
    title: messages.categories.title,
    description: messages.categories.description,
    path: "/categories",
  });
}

export default async function CategoriesPage() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  await connectToDatabase();

  const [categories, animes] = await Promise.all([
    Article.aggregate<CategoryRow>([
      { $match: { status: "published", category: { $type: "string", $ne: "" } } },
      { $group: { _id: "$category", count: { $sum: 1 }, latestPublishedAt: { $max: "$publishedAt" } } },
      { $sort: { count: -1, latestPublishedAt: -1, _id: 1 } },
      { $limit: 24 },
    ]),
    Anime.find({}).sort({ updatedAt: -1 }).limit(8).lean(),
  ]);

  const jsonLd = buildCollectionJsonLd({
    title: messages.categories.title,
    description: messages.categories.description,
    path: "/categories",
    itemPaths: categories.map((category) => `/category/${category._id}`),
  });

  return (
    <div className="shell-container py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="panel px-6 py-8 md:px-10 md:py-12">
        <span className="eyebrow">{messages.categories.eyebrow}</span>
        <h1 className="mt-5 font-display text-4xl font-semibold md:text-6xl">{messages.categories.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{messages.categories.description}</p>
      </section>

      <div className="grid-auto-fit mt-8">
        {categories.length ? (
          categories.map((category) => (
            <Link key={category._id} href={`/category/${category._id}`} className="panel p-6 transition-transform hover:-translate-y-0.5">
              <p className="text-sm uppercase tracking-[0.16em] text-muted">{messages.category.eyebrow}</p>
              <h2 className="mt-4 font-display text-3xl font-semibold capitalize">{category._id.replace(/-/g, " ")}</h2>
              <p className="mt-3 text-sm text-muted">{category.count} {messages.categories.itemSuffix}</p>
              <p className="mt-2 text-sm text-muted">
                {messages.categories.latest}: {formatDate(locale, category.latestPublishedAt || new Date())}
              </p>
            </Link>
          ))
        ) : (
          <div className="panel p-6 text-muted">{messages.categories.empty}</div>
        )}
      </div>

      {animes.length ? (
        <section className="mt-8 panel px-6 py-8 md:px-8">
          <h2 className="font-display text-3xl font-semibold">{messages.categories.animeTitle}</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {animes.map((anime) => (
              <Link key={anime._id.toString()} className="button-secondary" href={`/anime/${anime.slug}`}>
                {anime.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}