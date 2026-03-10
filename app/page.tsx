import Link from "next/link";

import AdUnit from "@/app/components/AdUnit";
import ArticleCard from "@/app/components/ArticleCard";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { absoluteUrl } from "@/lib/seo";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

async function getHomepageArticles() {
  await connectToDatabase();

  const [featured, latest] = await Promise.all([
    Article.find({ status: "published" }).sort({ publishedAt: -1, updatedAt: -1 }).limit(1).lean(),
    Article.find({ status: "published" }).sort({ publishedAt: -1, updatedAt: -1 }).limit(6).lean(),
  ]);

  return {
    featured: featured[0] || null,
    latest,
  };
}

export default async function Home() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { featured, latest } = await getHomepageArticles();

  return (
    <div className="shell-container py-8 md:py-12">
      <section className="panel grid gap-8 overflow-hidden px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-10 md:py-12">
        <div className="space-y-6">
          <span className="eyebrow">{messages.home.eyebrow}</span>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-display text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">
              {messages.home.title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted">
              {messages.home.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="button-primary" href="/news">
              {messages.home.browse}
            </Link>
            <Link className="button-secondary" href="/admin/drafts">
              {messages.home.reviewDrafts}
            </Link>
          </div>
        </div>
        <div className="panel bg-surface-strong p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">{messages.home.featured}</p>
          {featured ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted">{featured.category || messages.home.industry}</p>
              <h2 className="font-display text-3xl font-semibold">
                {featured.title}
              </h2>
              <p className="text-muted">{featured.excerpt || messages.home.noSummary}</p>
              <Link className="button-primary" href={`/news/${featured.slug}`}>
                {messages.home.readArticle}
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <h2 className="font-display text-3xl font-semibold">
                {messages.home.waitingTitle}
              </h2>
              <p className="text-muted">
                {messages.home.waitingDescription}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{messages.home.latestEyebrow}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold">
                {messages.home.latestTitle}
              </h2>
            </div>
            <Link className="text-sm font-semibold text-accent" href="/news">
              {messages.home.viewAll}
            </Link>
          </div>
          <div className="grid-auto-fit">
            {latest.length ? (
              latest.map((article) => (
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
              <div className="panel p-6 text-muted">
                {messages.home.noArticles}
              </div>
            )}
          </div>
        </div>
        <aside className="space-y-6">
          <AdUnit slot="header" />
          <div className="panel p-6">
            <p className="eyebrow">{messages.home.seoEyebrow}</p>
            <h3 className="mt-4 font-display text-2xl font-semibold">
              {messages.home.seoTitle}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              {messages.home.seoDescription} {absoluteUrl("/")}{messages.home.seoDescriptionTail}
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
