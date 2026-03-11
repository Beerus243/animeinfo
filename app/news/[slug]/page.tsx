import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  permanentRedirect(`/article/${slug}`);
}