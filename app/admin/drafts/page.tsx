import Link from "next/link";

import DraftCard from "@/app/admin/components/DraftCard";
import ProcessDraftsButton from "@/app/admin/components/ProcessDraftsButton";
import { isFrenchAiPipelineConfigured } from "@/lib/articleTranslation";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type DraftsPageProps = {
  searchParams?: Promise<{ filter?: string }>;
};

export default async function DraftsPage({ searchParams }: DraftsPageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const aiEnabled = isFrenchAiPipelineConfigured();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filter = ["all", "no-image", "ai-pending", "ai-done", "ai-failed"].includes(resolvedSearchParams?.filter || "")
    ? (resolvedSearchParams?.filter as "all" | "no-image" | "ai-pending" | "ai-done" | "ai-failed")
    : "all";
  await connectToDatabase();

  const baseQuery = {
    status: { $in: ["draft", "review"] },
  };

  const query = filter === "no-image"
    ? {
        ...baseQuery,
        status: { $in: ["draft", "review"] },
        $or: [
          { coverImage: { $exists: false } },
          { coverImage: null },
          { coverImage: "" },
        ],
      }
    : filter === "ai-pending"
      ? { ...baseQuery, aiStatus: "pending" }
      : filter === "ai-done"
        ? { ...baseQuery, aiStatus: "done" }
        : filter === "ai-failed"
          ? { ...baseQuery, aiStatus: "failed" }
          : baseQuery;

  const drafts = await Article.find(query)
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  return (
    <div className="shell-container py-8 md:py-12">
      <section className="panel px-6 py-8 md:px-10 md:py-12">
        <span className="eyebrow">{messages.admin.draftEyebrow}</span>
        <h1 className="mt-5 font-display text-4xl font-semibold md:text-5xl">
          {messages.admin.draftTitle}
        </h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={filter === "all" ? "button-primary" : "button-secondary"} href="/admin/drafts">
            {messages.admin.draftAll}
          </Link>
          <Link className={filter === "no-image" ? "button-primary" : "button-secondary"} href="/admin/drafts?filter=no-image">
            {messages.admin.draftWithoutImage}
          </Link>
          {aiEnabled ? (
            <>
              <Link className={filter === "ai-pending" ? "button-primary" : "button-secondary"} href="/admin/drafts?filter=ai-pending">
                {messages.admin.draftAiPending}
              </Link>
              <Link className={filter === "ai-done" ? "button-primary" : "button-secondary"} href="/admin/drafts?filter=ai-done">
                {messages.admin.draftAiDone}
              </Link>
              <Link className={filter === "ai-failed" ? "button-primary" : "button-secondary"} href="/admin/drafts?filter=ai-failed">
                {messages.admin.draftAiFailed}
              </Link>
              <ProcessDraftsButton
                idleLabel={messages.admin.processDrafts}
                pendingLabel={messages.admin.processingDrafts}
                successLabel={messages.admin.processDraftsSuccess}
                emptyLabel={messages.admin.processDraftsEmpty}
                failedLabel={messages.admin.processDraftsFailed}
              />
            </>
          ) : null}
        </div>
      </section>
      {drafts.length ? (
        <div className="grid-auto-fit mt-8">
          {drafts.map((draft) => (
            <DraftCard
              key={draft._id.toString()}
              draft={{
                id: draft._id.toString(),
                title: draft.title,
                excerpt: draft.excerpt ?? undefined,
                coverImage: draft.coverImage ?? undefined,
                sourceName: draft.sourceName ?? undefined,
                aiStatus: draft.aiStatus ?? undefined,
                aiError: draft.aiError ?? undefined,
                updatedAt: draft.updatedAt,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="panel mt-8 p-6 text-muted">{messages.admin.draftEmpty}</div>
      )}
    </div>
  );
}