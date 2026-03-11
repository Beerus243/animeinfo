import { notFound } from "next/navigation";

import AdminAnimeEditor from "@/app/admin/components/AdminAnimeEditor";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { connectToDatabase } from "@/lib/mongodb";
import Anime from "@/models/Anime";

export const dynamic = "force-dynamic";

type AdminAnimeEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminAnimeEditPage({ params }: AdminAnimeEditPageProps) {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const { id } = await params;

  await connectToDatabase();
  const anime = await Anime.findById(id).lean();

  if (!anime) {
    notFound();
  }

  const initialAnime = JSON.parse(JSON.stringify(anime));

  return (
    <div className="shell-container py-8 md:py-12">
      <div className="mb-4">
        <p className="eyebrow">{messages.adminAnime.editorEyebrow}</p>
      </div>
      <AdminAnimeEditor initialAnime={initialAnime} />
    </div>
  );
}