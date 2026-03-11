import Link from "next/link";

import CreateDraftButtons from "@/app/admin/components/CreateDraftButtons";
import ImportRecommendationsButton from "@/app/admin/components/ImportRecommendationsButton";
import AdminLogoutButton from "@/app/admin/components/AdminLogoutButton";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  await connectToDatabase();

  const [drafts, review, published] = await Promise.all([
    Article.countDocuments({ status: "draft" }),
    Article.countDocuments({ status: "review" }),
    Article.countDocuments({ status: "published" }),
  ]);

  const stats = [
    { label: messages.admin.drafts, value: drafts },
    { label: messages.admin.inReview, value: review },
    { label: messages.admin.published, value: published },
  ];

  return (
    <div className="shell-container py-8 md:py-12">
      <section className="panel px-5 py-6 md:px-10 md:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="eyebrow">{messages.admin.dashboardEyebrow}</span>
            <h1 className="mt-4 font-display text-3xl font-semibold md:mt-5 md:text-5xl">
              {messages.admin.dashboardTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted md:leading-7">{messages.admin.accessDescription}</p>
          </div>
          <AdminLogoutButton />
        </div>
        <div className="grid-auto-fit mt-8">
          {stats.map((stat) => (
            <div key={stat.label} className="content-card rounded-3xl p-5 md:p-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted md:text-sm">{stat.label}</p>
              <p className="mt-3 font-display text-3xl font-semibold md:mt-4 md:text-4xl">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2.5 md:gap-3">
          <CreateDraftButtons />
          <Link className="button-secondary" href="/admin/anime">
            {messages.admin.manageAnime}
          </Link>
          <Link className="button-secondary" href="/admin/subscribers">
            {messages.admin.manageSubscribers}
          </Link>
          <Link className="button-primary" href="/admin/drafts">
            {messages.admin.openDrafts}
          </Link>
          <ImportRecommendationsButton
            idleLabel={messages.admin.importRecommendations}
            pendingLabel={messages.admin.importingRecommendations}
            successLabel={messages.admin.importRecommendationsSuccess}
            emptyLabel={messages.admin.importRecommendationsEmpty}
            failedLabel={messages.admin.importRecommendationsFailed}
          />
          <Link className="button-secondary" href="/api/cron/import-news">
            {messages.admin.triggerImport}
          </Link>
        </div>
      </section>
    </div>
  );
}