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
    aiStatus?: "pending" | "done" | "failed";
    aiError?: string;
    updatedAt?: Date | string;
  };
};

export default function DraftCard({ draft }: DraftCardProps) {
  const { locale, messages } = useLanguage();
  const hasCloudinaryImage = Boolean(draft.coverImage && /res\.cloudinary\.com/i.test(draft.coverImage));
  const hasSourceImage = Boolean(draft.coverImage && !hasCloudinaryImage);
  const aiStatusClass = draft.aiStatus === "done" ? "status-chip-success" : draft.aiStatus === "failed" ? "status-chip-danger" : "status-chip-warning";
  const aiStatusLabel = draft.aiStatus === "done"
    ? messages.draftCard.aiDone
    : draft.aiStatus === "failed"
      ? messages.draftCard.aiFailed
      : messages.draftCard.aiPending;

  return (
    <article className="content-card p-5 md:p-6">
      {draft.coverImage ? (
        <div className="mb-4 overflow-hidden rounded-[1rem] border border-line bg-black/5">
          <img
            alt={draft.title}
            className="h-48 w-full object-cover"
            loading="lazy"
            src={draft.coverImage}
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted md:text-xs">{draft.sourceName || messages.draftCard.importedSource}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`status-chip ${aiStatusClass}`}>{aiStatusLabel}</span>
          <span className={`status-chip ${hasCloudinaryImage ? "status-chip-success" : "status-chip-warning"}`}>
            {hasCloudinaryImage
              ? messages.draftCard.cloudinaryReady
              : hasSourceImage
                ? messages.draftCard.sourceImage
                : messages.draftCard.noImage}
          </span>
        </div>
      </div>
      <h2 className="mt-3 font-display text-xl font-semibold md:mt-4 md:text-2xl">{draft.title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted md:leading-7">{draft.excerpt || messages.draftCard.noExcerpt}</p>
      {draft.aiStatus === "failed" && draft.aiError ? <p className="mt-3 text-sm leading-6 text-[var(--warning)]">{draft.aiError}</p> : null}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 md:mt-6 md:gap-4">
        <span className="text-[11px] text-muted md:text-xs">
          {messages.draftCard.updated} {draft.updatedAt ? formatDateTime(locale, draft.updatedAt) : messages.draftCard.recently}
        </span>
        <Link className="button-secondary min-h-10 px-4 py-2 text-sm font-semibold" href={`/admin/edit/${draft.id}`}>
          {messages.draftCard.openEditor}
        </Link>
      </div>
    </article>
  );
}