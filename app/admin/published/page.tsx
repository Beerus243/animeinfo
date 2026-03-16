import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

import PublishedArticleCard from "@/app/admin/components/PublishedArticleCard";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyAdminSession } from "@/lib/adminAuth";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type PublishedArticlesPageProps = {
  searchParams?: Promise<{ filter?: string }>;
};

export default async function PublishedArticlesPage({ searchParams }: PublishedArticlesPageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("mangaempire-admin-session")?.value;
  const isAuthenticated = await verifyAdminSession(sessionValue);

  if (!isAuthenticated) {
    redirect("/admin/login?redirect=" + encodeURIComponent("/admin/published"));
  }

  await connectToDatabase();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filter = ["all", "news", "recommendation"].includes(resolvedSearchParams?.filter || "")
    ? (resolvedSearchParams?.filter as "all" | "news" | "recommendation")
    : "all";

  const query = filter === "news"
    ? { status: "published", section: "news" }
    : filter === "recommendation"
      ? { status: "published", section: "recommendation" }
      : { status: "published" };

  const articles = await Article.find(query)
    .sort({ updatedAt: -1, publishedAt: -1 })
    .limit(60)
    .lean();

  return (
    <div className="shell-container py-8 md:py-12">
      <section className="panel px-6 py-8 md:px-10 md:py-12">
        <span className="eyebrow">{messages.admin.publishedEyebrow}</span>
        <h1 className="mt-5 font-display text-4xl font-semibold md:text-5xl">
          {messages.admin.publishedTitle}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted md:leading-7">{messages.admin.publishedDescription}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="button-secondary" href="/admin">
            Admin
          </Link>
          <Link className="button-secondary" href="/admin/drafts">
            {messages.admin.openDrafts}
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={filter === "all" ? "button-primary" : "button-secondary"} href="/admin/published">
            {messages.admin.publishedAll}
          </Link>
          <Link className={filter === "news" ? "button-primary" : "button-secondary"} href="/admin/published?filter=news">
            {messages.admin.publishedNews}
          </Link>
          <Link className={filter === "recommendation" ? "button-primary" : "button-secondary"} href="/admin/published?filter=recommendation">
            {messages.admin.publishedRecommendation}
          </Link>
        </div>
      </section>
      {articles.length ? (
        <div className="grid-auto-fit mt-8">
          {articles.map((article) => (
            <PublishedArticleCard
              key={article._id.toString()}
              article={{
                id: article._id.toString(),
                title: article.title,
                excerpt: article.excerpt ?? undefined,
                coverImage: article.coverImage ?? undefined,
                category: article.category ?? undefined,
                section: article.section ?? undefined,
                recommendationType: article.recommendationType ?? undefined,
                updatedAt: article.updatedAt,
                publishedAt: article.publishedAt,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="panel mt-8 p-6 text-muted">{messages.admin.publishedEmpty}</div>
      )}
    </div>
  );
}