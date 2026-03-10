"use client";

import Link from "next/link";

import { useLanguage } from "@/app/components/LanguageProvider";
import { formatDateTime } from "@/lib/i18n/messages";

type DraftCardProps = {
  draft: {
    id: string;
    title: string;
    excerpt?: string;
    coverImage?: string;
    sourceName?: string;
    updatedAt?: Date | string;
  };
};

export default function DraftCard({ draft }: DraftCardProps) {
  const { locale, messages } = useLanguage();
  const hasCloudinaryImage = Boolean(draft.coverImage && /res\.cloudinary\.com/i.test(draft.coverImage));
  const hasSourceImage = Boolean(draft.coverImage && !hasCloudinaryImage);

  return (
    <article className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">{draft.sourceName || messages.draftCard.importedSource}</p>
        <span className={`status-chip ${hasCloudinaryImage ? "status-chip-success" : "status-chip-warning"}`}>
          {hasCloudinaryImage
            ? messages.draftCard.cloudinaryReady
            : hasSourceImage
              ? messages.draftCard.sourceImage
              : messages.draftCard.noImage}
        </span>
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold">{draft.title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{draft.excerpt || messages.draftCard.noExcerpt}</p>
      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="text-xs text-muted">
          {messages.draftCard.updated} {draft.updatedAt ? formatDateTime(locale, draft.updatedAt) : messages.draftCard.recently}
        </span>
        <Link className="button-secondary min-h-10 px-4 py-2 text-sm font-semibold" href={`/admin/edit/${draft.id}`}>
          {messages.draftCard.openEditor}
        </Link>
      </div>
    </article>
  );
}