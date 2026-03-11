import type { Metadata } from "next";

import ArticleCard from "@/app/components/ArticleCard";
import { resolveArticleLocalization } from "@/lib/articleLocalization";
import { ensureArticlesLocalization } from "@/lib/articleTranslation";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { buildCollectionJsonLd, buildMetadata } from "@/lib/seo";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { slug } = await params;
  const label = slug.replace(/-/g, " ");

  return buildMetadata({
    title: `${label} | ${messages.category.eyebrow}`,
    description: messages.category.description,
    path: `/category/${slug}`,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { slug } = await params;
  await connectToDatabase();

  const articles = await Article.find({ category: slug, status: "published" })
    .sort({ publishedAt: -1, updatedAt: -1 })
    .lean();
  const localizedArticles = await ensureArticlesLocalization(articles, locale);
  const jsonLd = buildCollectionJsonLd({
    title: slug.replace(/-/g, " "),
    description: messages.category.description,
    path: `/category/${slug}`,
    itemPaths: localizedArticles.map((article) => `/article/${resolveArticleLocalization(article, locale).slug || article.slug}`),
  });

  return (
    <div className="shell-container py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="panel px-6 py-8 md:px-10 md:py-12">
        <span className="eyebrow">{messages.category.eyebrow}</span>
        <h1 className="mt-5 font-display text-4xl font-semibold capitalize md:text-5xl">
          {slug.replace(/-/g, " ")}
        </h1>
        <p className="mt-3 text-muted">{messages.category.description}</p>
      </section>
      <div className="grid-auto-fit mt-8">
        {localizedArticles.length ? (
          localizedArticles.map((article) => (
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
          <div className="panel p-6 text-muted">{messages.category.empty}</div>
        )}
      </div>
    </div>
  );
}