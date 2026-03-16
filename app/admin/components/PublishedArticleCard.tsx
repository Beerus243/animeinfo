"use client";

import Link from "next/link";

import { useLanguage } from "@/app/components/LanguageProvider";
import { formatDateTime } from "@/lib/i18n/messages";

type PublishedArticleCardProps = {
  article: {
    id: string;
    title: string;
    excerpt?: string;
    coverImage?: string;
    category?: string;
    section?: "news" | "recommendation";
    recommendationType?: "anime" | "manga" | "webtoon" | "culture";
    updatedAt?: Date | string;
    publishedAt?: Date | string;
  };
};

export default function PublishedArticleCard({ article }: PublishedArticleCardProps) {
  const { locale, messages } = useLanguage();
  const articleTypeLabel = article.section === "recommendation"
    ? `${messages.editor.sectionRecommendation} • ${article.recommendationType === "manga"
      ? messages.editor.recommendationTypeManga
      : article.recommendationType === "webtoon"
        ? messages.editor.recommendationTypeWebtoon
        : article.recommendationType === "culture"
          ? messages.editor.recommendationTypeCulture
          : messages.editor.recommendationTypeAnime}`
    : messages.editor.sectionNews;

  return (
    <article className="content-card p-5 md:p-6">
      {article.coverImage ? (
        <div className="mb-4 overflow-hidden rounded-[1rem] border border-line bg-black/5">
          <img
            alt={article.title}
            className="h-48 w-full object-cover"
            loading="lazy"
            src={article.coverImage}
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted md:text-xs">{articleTypeLabel}</p>
        <span className="status-chip status-chip-success">{messages.admin.published}</span>
      </div>
      <h2 className="mt-3 font-display text-xl font-semibold md:mt-4 md:text-2xl">{article.title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted md:leading-7">{article.excerpt || messages.card.excerptFallback}</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 md:mt-6 md:gap-4">
        <span className="text-[11px] text-muted md:text-xs">
          {messages.admin.publishedUpdated} {article.updatedAt ? formatDateTime(locale, article.updatedAt) : messages.draftCard.recently}
        </span>
        <Link className="button-secondary min-h-10 px-4 py-2 text-sm font-semibold" href={`/admin/edit/${article.id}`}>
          {messages.admin.editPublished}
        </Link>
      </div>
      {article.publishedAt ? (
        <p className="mt-3 text-[11px] text-muted md:text-xs">
          {messages.admin.published} {formatDateTime(locale, article.publishedAt)}
        </p>
      ) : null}
    </article>
  );
}