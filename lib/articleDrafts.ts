import { slugify } from "@/lib/slugify";
import Article from "@/models/Article";

export type EditorialSection = "news" | "recommendation";
export type RecommendationKind = "anime" | "manga" | null;

export function buildImportedArticleKey(
  originalUrl: string,
  section: EditorialSection,
  recommendationType?: Exclude<RecommendationKind, null> | undefined,
) {
  return [section, recommendationType || "general", originalUrl.trim()].join("::");
}

type UniqueSlugOptions = {
  excludeId?: string;
};

export async function ensureUniqueArticleSlug(title: string, options: UniqueSlugOptions = {}) {
  const baseSlug = slugify(title) || "article";
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await Article.findOne({
      slug: candidate,
      ...(options.excludeId ? { _id: { $ne: options.excludeId } } : {}),
    })
      .select({ _id: 1 })
      .lean();

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export function buildManualDraftTitle(section: EditorialSection, recommendationType: RecommendationKind) {
  if (section === "recommendation") {
    return recommendationType === "manga" ? "Nouvelle recommandation manga" : "Nouvelle recommandation anime";
  }

  return "Nouvel article";
}

export function buildManualDraftOriginalUrl(section: EditorialSection, recommendationType: RecommendationKind) {
  const typeSegment = recommendationType ?? "general";
  return `manual://${section}/${typeSegment}/${Date.now()}`;
}