"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "@/app/components/LanguageProvider";
import { formatDate } from "@/lib/i18n/messages";

type ArticleCardProps = {
  article: {
    title: string;
    slug: string;
    excerpt?: string;
    category?: string;
    coverImage?: string;
    publishedAt?: Date | string;
  };
};

export default function ArticleCard({ article }: ArticleCardProps) {
  const { locale, messages } = useLanguage();

  return (
    <article className="panel overflow-hidden">
      <div className="relative h-52 overflow-hidden bg-[linear-gradient(135deg,rgba(235,94,40,0.85),rgba(53,141,123,0.75))]">
        {article.coverImage ? (
          <>
            <Image
              alt={article.title}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={article.coverImage}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />
          </>
        ) : null}
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.14em] text-muted">
          <span>{article.category || messages.card.defaultCategory}</span>
          <span>
            {article.publishedAt
              ? formatDate(locale, article.publishedAt)
              : messages.card.pending}
          </span>
        </div>
        <div>
          <h3 className="font-display text-2xl font-semibold leading-tight">
            {article.title}
          </h3>
          <p className="mt-3 text-base leading-7 text-muted">
            {article.excerpt || messages.card.excerptFallback}
          </p>
        </div>
        <Link aria-label={`${messages.card.readAriaPrefix} ${article.title}`} className="button-secondary" href={`/article/${article.slug}`}>
          {messages.card.readMore}
        </Link>
      </div>
    </article>
  );
}