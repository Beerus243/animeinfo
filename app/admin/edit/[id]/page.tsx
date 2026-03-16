import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

import Editor from "@/app/admin/components/Editor";
import PublishButton from "@/app/admin/components/PublishButton";
import { isAutomaticRewritingConfigured, isAutomaticTranslationConfigured } from "@/lib/articleTranslation";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyAdminSession } from "@/lib/adminAuth";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: EditPageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { id } = await params;

  // Check admin authentication
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("mangaempire-admin-session")?.value;
  const isAuthenticated = await verifyAdminSession(sessionValue);

  if (!isAuthenticated) {
    redirect("/admin/login?redirect=" + encodeURIComponent(`/admin/edit/${id}`));
  }

  await connectToDatabase();

  const article = await Article.findById(id).lean();

  if (!article) {
    notFound();
  }

  const initialArticle = JSON.parse(JSON.stringify(article));
  const translationEnabled = isAutomaticTranslationConfigured();
  const rewritingEnabled = isAutomaticRewritingConfigured();

  return (
    <div className="shell-container py-8 md:py-12">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">{messages.admin.editorEyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
            {messages.admin.editorTitle}
          </h1>
        </div>
        <PublishButton articleId={initialArticle._id} currentStatus={initialArticle.status} />
      </div>
      <Editor initialArticle={initialArticle} rewritingEnabled={rewritingEnabled} translationEnabled={translationEnabled} />
    </div>
  );
}