import { getCurrentSeasonLabel } from "@/lib/animeSeason";

const ICOTAKU_BASE_URL = "https://anime.icotaku.com";

export type IcotakuAiringItem = {
  title: string;
  url: string;
  releaseDay: string;
  nextEpisodeAt: Date;
  currentSeasonLabel: string;
  status: "airing";
  episodeLabel?: string;
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&eacute;/gi, "e")
    .replace(/&egrave;/gi, "e")
    .replace(/&ecirc;/gi, "e")
    .replace(/&agrave;/gi, "a")
    .replace(/&ccedil;/gi, "c")
    .replace(/&rsquo;/gi, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(value?: string) {
  return decodeHtmlEntities(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchIcotakuHtml(pathOrUrl: string) {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${ICOTAKU_BASE_URL}${pathOrUrl}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "AnimeInfoBot/1.0 (+https://animeinfo.local)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Icotaku request failed: ${response.status}`);
  }

  return response.text();
}

function getReferenceDate(html: string) {
  const match = html.match(/name="date_debut"[^>]+value="(\d{4})-(\d{2})-(\d{2})"/i);
  if (!match) {
    return new Date();
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0, 0);
}

function parseCalendarTables(html: string, referenceDate: Date) {
  const results = new Map<string, IcotakuAiringItem>();
  const tablePattern = /<table[^>]+class="calendrier_diffusion"[^>]*>[\s\S]*?<th[^>]*><b>([^<]+)<\/b>\s*(\d+)(?:[\s\S]*?<span class="calendrier_today">Aujourd'hui<\/span>)?[\s\S]*?<\/th>([\s\S]*?)<\/table>/gi;

  for (const tableMatch of html.matchAll(tablePattern)) {
    const releaseDay = stripHtml(tableMatch[1]);
    const dayOfMonth = Number(tableMatch[2]);
    if (!dayOfMonth) {
      continue;
    }

    const nextEpisodeAt = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      dayOfMonth,
      12,
      0,
      0,
      0,
    );

    if (nextEpisodeAt < referenceDate) {
      continue;
    }

    const body = tableMatch[3] || "";
    const itemPattern = /<a href="(\/anime\/\d+\/[^"#]+\.html)">([\s\S]*?)<\/a><\/span>\s*<span class="calendrier_episode">([\s\S]*?)<\/span>/gi;

    for (const itemMatch of body.matchAll(itemPattern)) {
      const relativeUrl = itemMatch[1]?.trim();
      const title = stripHtml(itemMatch[2]);
      const episodeLabel = stripHtml(itemMatch[3]);
      if (!relativeUrl || !title) {
        continue;
      }

      const key = relativeUrl.toLowerCase();
      const current = results.get(key);
      if (current && current.nextEpisodeAt <= nextEpisodeAt) {
        continue;
      }

      results.set(key, {
        title,
        url: `${ICOTAKU_BASE_URL}${relativeUrl}`,
        releaseDay,
        nextEpisodeAt,
        currentSeasonLabel: getCurrentSeasonLabel(nextEpisodeAt),
        status: "airing",
        episodeLabel,
      });
    }
  }

  return Array.from(results.values()).sort((left, right) => left.nextEpisodeAt.getTime() - right.nextEpisodeAt.getTime());
}

export async function importIcotakuAiringCalendar() {
  const html = await fetchIcotakuHtml("/calendrier_diffusion.html");
  const referenceDate = getReferenceDate(html);
  return parseCalendarTables(html, referenceDate);
}