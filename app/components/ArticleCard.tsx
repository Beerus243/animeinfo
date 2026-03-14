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
  const fallbackLetter = article.title.trim().charAt(0).toUpperCase() || "A";

  return (
    <article className="article-card panel overflow-hidden">
      <div className="article-card-media relative h-40 overflow-hidden bg-[linear-gradient(135deg,rgba(235,94,40,0.92),rgba(53,141,123,0.82))] md:h-44">
        <div className="absolute left-3 top-3 z-10">
          <span className="article-card-category-badge">{article.category || messages.card.defaultCategory}</span>
        </div>
        {article.coverImage ? (
          <>
            <Image
              alt={article.title}
              className="object-cover saturate-[1.02] scale-[1.02]"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={article.coverImage}
            />
            <div className="article-card-image-overlay absolute inset-0" />
          </>
        ) : (
          <div className="article-card-fallback absolute inset-0">
            <div className="article-card-fallback-mark">{fallbackLetter}</div>
            <div className="article-card-fallback-copy">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">{article.category || messages.card.defaultCategory}</p>
              <p className="mt-2 max-w-[16rem] font-display text-2xl font-semibold leading-tight text-white">{article.title}</p>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/18 to-transparent" />
      </div>
      <div className="space-y-3 p-4 md:p-4.5">
        <div className="flex items-center justify-end gap-3 text-[10px] uppercase tracking-[0.13em] text-muted md:text-[11px]">
          <span>
            {article.publishedAt
              ? formatDate(locale, article.publishedAt)
              : messages.card.pending}
          </span>
        </div>
        <div>
          <h3 className="article-card-title font-display text-xl font-semibold leading-[1.08] tracking-[-0.025em] md:text-[1.4rem]">
            {article.title}
          </h3>
          <p className="mt-2.5 text-[13px] leading-6 text-muted md:text-sm md:leading-6">
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