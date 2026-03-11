import type { Metadata } from "next";

import ArticleCard from "@/app/components/ArticleCard";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { buildCollectionJsonLd, buildMetadata } from "@/lib/seo";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type TagPageProps = {
  params: Promise<{ slug: string }>;
};

function tagLabelFromSlug(slug: string) {
  return slug.replace(/-/g, " ");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { slug } = await params;
  const label = tagLabelFromSlug(slug);

  return buildMetadata({
    title: `${label} | ${messages.tag.eyebrow}`,
    description: messages.tag.description,
    path: `/tag/${slug}`,
  });
}

export default async function TagPage({ params }: TagPageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { slug } = await params;
  const label = tagLabelFromSlug(slug);
  const pattern = new RegExp(`^${escapeRegex(label)}$`, "i");

  await connectToDatabase();

  const articles = await Article.find({ status: "published", tags: { $regex: pattern } })
    .sort({ publishedAt: -1, updatedAt: -1 })
    .lean();

  const jsonLd = buildCollectionJsonLd({
    title: label,
    description: messages.tag.description,
    path: `/tag/${slug}`,
    itemPaths: articles.map((article) => `/article/${article.slug}`),
  });

  return (
    <div className="shell-container py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="panel px-6 py-8 md:px-10 md:py-12">
        <span className="eyebrow">{messages.tag.eyebrow}</span>
        <h1 className="mt-5 font-display text-4xl font-semibold capitalize md:text-5xl">{label}</h1>
        <p className="mt-3 text-muted">{messages.tag.description}</p>
      </section>
      <div className="grid-auto-fit mt-8">
        {articles.length ? (
          articles.map((article) => (
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
          ))
        ) : (
          <div className="panel p-6 text-muted">{messages.tag.empty}</div>
        )}
      </div>
    </div>
  );
}