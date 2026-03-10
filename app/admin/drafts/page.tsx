import Link from "next/link";

import DraftCard from "@/app/admin/components/DraftCard";
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
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filter = resolvedSearchParams?.filter === "no-image" ? "no-image" : "all";
  await connectToDatabase();

  const query = filter === "no-image"
    ? {
        status: { $in: ["draft", "review"] },
        $or: [
          { coverImage: { $exists: false } },
          { coverImage: null },
          { coverImage: "" },
        ],
      }
    : { status: { $in: ["draft", "review"] } };

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