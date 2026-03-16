import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { access } from "node:fs/promises";
import path from "node:path";

import Link from "next/link";

import CreateDraftButtons from "@/app/admin/components/CreateDraftButtons";
import ClearDraftsButton from "@/app/admin/components/ClearDraftsButton";
import ImportRecommendationsButton from "@/app/admin/components/ImportRecommendationsButton";
import ProcessDraftsButton from "@/app/admin/components/ProcessDraftsButton";
import AdminLogoutButton from "@/app/admin/components/AdminLogoutButton";
import { isFrenchAiPipelineConfigured } from "@/lib/articleTranslation";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyAdminSession } from "@/lib/adminAuth";
import { isWebPushConfigured } from "@/lib/webPush";
import Anime from "@/models/Anime";
import Article from "@/models/Article";
import NotificationSubscription from "@/models/NotificationSubscription";
import WebPushSubscription from "@/models/WebPushSubscription";

export const dynamic = "force-dynamic";

async function hasPushServiceWorker() {
  try {
    await access(path.join(process.cwd(), "public", "push-sw.js"));
    return true;
  } catch {
    return false;
  }
}

export default async function AdminPage() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  // Check admin authentication
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("mangaempire-admin-session")?.value;
  const isAuthenticated = await verifyAdminSession(sessionValue);

  if (!isAuthenticated) {
    redirect("/admin/login?redirect=/admin");
  }

  const aiEnabled = isFrenchAiPipelineConfigured();
  const pushConfigured = isWebPushConfigured();
  await connectToDatabase();

  const [drafts, review, published] = await Promise.all([
    Article.countDocuments({ status: "draft" }),
    Article.countDocuments({ status: "review" }),
    Article.countDocuments({ status: "published" }),
  ]);
  const [aiPending, aiDone, aiFailed] = await Promise.all([
    Article.countDocuments({ status: { $in: ["draft", "review"] }, aiStatus: "pending" }),
    Article.countDocuments({ status: { $in: ["draft", "review"] }, aiStatus: "done" }),
    Article.countDocuments({ status: { $in: ["draft", "review"] }, aiStatus: "failed" }),
  ]);
  const [publishedRecommendations, draftRecommendations, airingAnimeCount, popularAnimeCount, emailSubscribers, pushSubscribers] = await Promise.all([
    Article.countDocuments({ status: "published", section: "recommendation" }),
    Article.countDocuments({ status: { $in: ["draft", "review"] }, section: "recommendation" }),
    Anime.countDocuments({ status: "airing" }),
    Anime.countDocuments({ isPopularNow: true }),
    NotificationSubscription.countDocuments({ active: true }),
    WebPushSubscription.countDocuments({ active: true }),
  ]);
  const pushServiceWorkerAvailable = await hasPushServiceWorker();

  const coreStats = [
    { label: messages.admin.drafts, value: drafts },
    { label: messages.admin.inReview, value: review },
    { label: messages.admin.published, value: published },
  ];
  const aiStats = [
    { label: messages.admin.draftAiPending, value: aiPending },
    { label: messages.admin.draftAiDone, value: aiDone },
    { label: messages.admin.draftAiFailed, value: aiFailed },
  ];
  const operationStats = [
    { label: messages.admin.publishedRecommendations, value: publishedRecommendations, href: "/recommendations" },
    { label: messages.admin.pendingRecommendations, value: draftRecommendations, href: "/admin/drafts" },
    { label: messages.admin.airingAnimeCount, value: airingAnimeCount, href: "/admin/anime?filter=airing" },
    { label: messages.admin.popularAnimeCount, value: popularAnimeCount, href: "/admin/anime?filter=popular" },
    { label: messages.admin.subscribersCount, value: emailSubscribers + pushSubscribers, href: "/admin/subscribers" },
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
          {coreStats.map((stat) => (
            <div key={stat.label} className="content-card rounded-3xl p-5 md:p-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted md:text-sm">{stat.label}</p>
              <p className="mt-3 font-display text-3xl font-semibold md:mt-4 md:text-4xl">{stat.value}</p>
            </div>
          ))}
        </div>
        {aiEnabled ? (
          <div className="grid-auto-fit mt-5">
            {aiStats.map((stat) => (
              <div key={stat.label} className="content-card rounded-3xl p-5 md:p-6">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted md:text-sm">{stat.label}</p>
                <p className="mt-3 font-display text-3xl font-semibold md:mt-4 md:text-4xl">{stat.value}</p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-2.5 md:gap-3">
          <CreateDraftButtons />
          <Link className="button-primary" href="/admin/drafts">
            {messages.admin.openDrafts}
          </Link>
          <Link className="button-secondary" href="/admin/anime">
            {messages.admin.manageAnime}
          </Link>
          <ImportRecommendationsButton
            idleLabel={messages.admin.importRecommendations}
            pendingLabel={messages.admin.importingRecommendations}
            successLabel={messages.admin.importRecommendationsSuccess}
            emptyLabel={messages.admin.importRecommendationsEmpty}
            failedLabel={messages.admin.importRecommendationsFailed}
          />
          <ClearDraftsButton
            idleLabel={messages.admin.clearDrafts}
            pendingLabel={messages.admin.clearingDrafts}
            successLabel={messages.admin.clearDraftsSuccess}
            emptyLabel={messages.admin.clearDraftsEmpty}
            failedLabel={messages.admin.clearDraftsFailed}
            confirmLabel={messages.admin.clearDraftsConfirm}
          />
          {aiEnabled ? (
            <ProcessDraftsButton
              idleLabel={messages.admin.processDrafts}
              pendingLabel={messages.admin.processingDrafts}
              successLabel={messages.admin.processDraftsSuccess}
              emptyLabel={messages.admin.processDraftsEmpty}
              failedLabel={messages.admin.processDraftsFailed}
            />
          ) : null}
          <Link className="button-secondary" href="/api/cron/import-news">
            {messages.admin.triggerImport}
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted">
          <Link href="/admin/subscribers" className="font-medium text-accent">
            {messages.admin.manageSubscribers}
          </Link>
          <Link href="/recommendations" className="font-medium text-accent">
            {messages.recommendations.title}
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="content-card rounded-3xl p-5 md:p-6">
            <p className="eyebrow">{messages.admin.opsEyebrow}</p>
            <h2 className="mt-3 font-display text-2xl font-semibold md:text-[1.7rem]">{messages.admin.opsTitle}</h2>
            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-muted">{messages.admin.opsDescription}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {operationStats.map((stat) => (
                <Link key={stat.label} href={stat.href} className="rounded-2xl border border-line bg-white/35 p-4 transition-transform hover:-translate-y-0.5 dark:bg-white/3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{stat.label}</p>
                  <p className="mt-3 font-display text-3xl font-semibold">{stat.value}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="content-card rounded-3xl p-5 md:p-6">
            <p className="eyebrow">{messages.admin.workflowEyebrow}</p>
            <h2 className="mt-3 font-display text-2xl font-semibold md:text-[1.7rem]">{messages.admin.workflowTitle}</h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-muted">
              <div>
                <p className="font-semibold text-foreground">{messages.admin.workflowAutomaticTitle}</p>
                <p className="mt-1.5">{messages.admin.workflowAutomaticDescription}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{messages.admin.workflowManualTitle}</p>
                <p className="mt-1.5">{messages.admin.workflowManualDescription}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{messages.admin.workflowQualityTitle}</p>
                <p className="mt-1.5">{messages.admin.workflowQualityDescription}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 content-card rounded-3xl p-5 md:p-6">
          <p className="eyebrow">{messages.admin.pushDiagnosticsEyebrow}</p>
          <h2 className="mt-3 font-display text-2xl font-semibold md:text-[1.7rem]">{messages.admin.pushDiagnosticsTitle}</h2>
          <p className="mt-2.5 max-w-3xl text-sm leading-6 text-muted">{messages.admin.pushDiagnosticsDescription}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="push-diagnostic-card">
              <p className="push-diagnostic-label">{messages.admin.pushVapidLabel}</p>
              <span className={`status-chip ${pushConfigured ? "status-chip-success" : "status-chip-danger"}`}>
                {pushConfigured ? messages.admin.pushStatusReady : messages.admin.pushStatusMissing}
              </span>
            </div>
            <div className="push-diagnostic-card">
              <p className="push-diagnostic-label">{messages.admin.pushServiceWorkerLabel}</p>
              <span className={`status-chip ${pushServiceWorkerAvailable ? "status-chip-success" : "status-chip-danger"}`}>
                {pushServiceWorkerAvailable ? messages.admin.pushStatusReady : messages.admin.pushStatusMissing}
              </span>
            </div>
            <div className="push-diagnostic-card">
              <p className="push-diagnostic-label">{messages.admin.pushSubscribersLabel}</p>
              <p className="mt-3 font-display text-3xl font-semibold">{pushSubscribers}</p>
              <p className="mt-1 text-sm text-muted">{messages.admin.pushSubscribersDescription}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}