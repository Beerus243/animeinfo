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
    <article className="article-card panel overflow-hidden">
      <div className="relative h-48 overflow-hidden bg-[linear-gradient(135deg,rgba(235,94,40,0.92),rgba(53,141,123,0.82))] md:h-52">
        {article.coverImage ? (
          <>
            <Image
              alt={article.title}
              className="object-cover saturate-[1.05]"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={article.coverImage}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/18 to-transparent" />
          </>
        ) : null}
        <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/18 to-transparent" />
      </div>
      <div className="space-y-3 p-5 md:p-6">
        <div className="flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.14em] text-muted md:text-xs">
          <span className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent">{article.category || messages.card.defaultCategory}</span>
          <span>
            {article.publishedAt
              ? formatDate(locale, article.publishedAt)
              : messages.card.pending}
          </span>
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold leading-tight md:text-2xl">
            {article.title}
          </h3>
          <p className="mt-2.5 text-sm leading-6 text-muted md:text-[15px] md:leading-7">
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