import { notFound } from "next/navigation";

import Editor from "@/app/admin/components/Editor";
import PublishButton from "@/app/admin/components/PublishButton";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/Article";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: EditPageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { id } = await params;
  await connectToDatabase();

  const article = await Article.findById(id).lean();

  if (!article) {
    notFound();
  }

  const initialArticle = JSON.parse(JSON.stringify(article));

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
      <Editor initialArticle={initialArticle} />
    </div>
  );
}