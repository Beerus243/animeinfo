import { slugify } from "@/lib/slugify";
import Anime from "@/models/Anime";

type UniqueAnimeSlugOptions = {
  excludeId?: string;
};

export async function ensureUniqueAnimeSlug(title: string, options: UniqueAnimeSlugOptions = {}) {
  const baseSlug = slugify(title) || "anime";
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await Anime.findOne({
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

export function normalizeTagList(value: unknown) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeAnimeStatus(value: unknown) {
  return value === "upcoming" || value === "completed" || value === "hiatus" || value === "airing"
    ? value
    : undefined;
}