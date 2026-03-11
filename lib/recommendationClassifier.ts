import type { NormalizedRssItem } from "@/lib/rssParser";

type RecommendationKind = "anime" | "manga";

const MANGA_TERMS = [
  "manga",
  "mangas",
  "manhwa",
  "manhua",
  "webtoon",
  "one-shot",
  "oneshot",
  "graphic novel",
  "tankobon",
  "volume",
  "chapitre",
  "chapter",
  "scan",
];

const ANIME_TERMS = [
  "anime",
  "episode",
  "episodes",
  "season",
  "cour",
  "trailer",
  "teaser",
  "streaming",
  "crunchyroll",
  "tv anime",
  "ova",
  "ona",
  "film anime",
  "anime film",
];

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function countMatches(text: string, terms: string[]) {
  return terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0);
}

function scoreRecommendationKind(item: NormalizedRssItem) {
  const haystack = normalize([
    item.title,
    item.excerpt,
    item.content,
    item.originalUrl,
    item.sourceName,
    ...(item.categories || []),
  ].filter(Boolean).join(" \n "));

  return {
    anime: countMatches(haystack, ANIME_TERMS),
    manga: countMatches(haystack, MANGA_TERMS),
  };
}

export function detectRecommendationKind(item: NormalizedRssItem, fallback: RecommendationKind): RecommendationKind | null {
  const score = scoreRecommendationKind(item);

  if (score.manga > score.anime) {
    return "manga";
  }

  if (score.anime > score.manga) {
    return "anime";
  }

  if (fallback === "manga") {
    return score.manga > 0 ? "manga" : null;
  }

  return score.manga > 0 ? "manga" : "anime";
}

export function shouldImportRecommendationItem(item: NormalizedRssItem, configuredType: RecommendationKind) {
  const detected = detectRecommendationKind(item, configuredType);

  if (configuredType === "manga") {
    return detected === "manga";
  }

  return detected !== "manga";
}