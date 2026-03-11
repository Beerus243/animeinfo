import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

type NewsPageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const resolved = searchParams ? await searchParams : undefined;
  const page = resolved?.page?.trim();
  permanentRedirect(page ? `/articles?page=${encodeURIComponent(page)}` : "/articles");
}