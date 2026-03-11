import type { Metadata } from "next";

import ArticleCard from "@/app/components/ArticleCard";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { buildCollectionJsonLd, buildMetadata } from "@/lib/seo";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

type SearchArticle = {
  _id: { toString(): string };
  title: string;
  slug: string;
  excerpt?: string | null;
  category?: string | null;
  coverImage?: string | null;
  publishedAt?: Date | null;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return buildMetadata({
    title: messages.search.title,
    description: messages.search.description,
    path: "/search",
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const resolved = searchParams ? await searchParams : undefined;
  const query = resolved?.q?.trim() || "";

  let articles: SearchArticle[] = [];

  if (query) {
    await connectToDatabase();
    const regex = new RegExp(escapeRegex(query), "i");
    articles = (await Article.find({
      status: "published",
      $or: [
        { title: regex },
        { excerpt: regex },
        { category: regex },
        { anime: regex },
        { tags: { $regex: regex } },
      ],
    })
      .sort({ publishedAt: -1, updatedAt: -1 })
      .limit(24)
      .lean()) as SearchArticle[];
  }

  const jsonLd = buildCollectionJsonLd({
    title: query ? `${messages.search.summaryPrefix} ${query}` : messages.search.title,
    description: messages.search.description,
    path: query ? `/search?q=${encodeURIComponent(query)}` : "/search",
    itemPaths: articles.map((article) => `/article/${article.slug}`),
  });

  return (
    <div className="shell-container py-6 md:py-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="panel px-5 py-6 md:px-8 md:py-8">
        <span className="eyebrow">{messages.search.eyebrow}</span>
        <h1 className="mt-4 font-display text-3xl font-semibold md:text-5xl">{messages.search.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted md:text-base md:leading-7">{messages.search.description}</p>
        <form action="/search" className="mt-6 flex flex-col gap-2.5 md:flex-row">
          <input
            className="w-full rounded-2xl border border-line bg-white/80 px-3.5 py-2.5 text-sm dark:bg-background/70"
            defaultValue={query}
            name="q"
            placeholder={messages.search.placeholder}
            type="search"
          />
          <button className="button-primary md:min-w-32" type="submit">
            {messages.search.submit}
          </button>
        </form>
      </section>

      <div className="mt-6 md:mt-8">
        {query ? (
          <p className="mb-5 text-[13px] text-muted md:text-sm">{messages.search.summaryPrefix} <span className="font-medium text-foreground">{query}</span></p>
        ) : null}
        <div className="grid-auto-fit">
          {query ? (
            articles.length ? (
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
              <div className="panel p-5 text-sm text-muted">{messages.search.empty}</div>
            )
          ) : (
            <div className="panel p-5 text-sm text-muted">{messages.search.idle}</div>
          )}
        </div>
      </div>
    </div>
  );
}