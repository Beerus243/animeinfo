import Parser from "rss-parser";

import { getConfiguredRssSourceGroups } from "@/lib/rssParser";
import { slugify } from "@/lib/slugify";
import { getVoiranimeGenreSources } from "@/lib/voiranime";
import TrendSnapshot from "@/models/TrendSnapshot";

const parser = new Parser({ timeout: 15_000 });

const STOP_WORDS = new Set([
  "about",
  "after",
  "anime",
  "avec",
  "avec",
  "being",
  "dans",
  "from",
  "have",
  "just",
  "manga",
  "more",
  "news",
  "pour",
  "preview",
  "reveal",
  "reveals",
  "season",
  "sur",
  "that",
  "their",
  "this",
  "trailer",
  "with",
]);

type RssPreviewItem = {
  title: string;
  url: string;
  sourceLabel: string;
  publishedAt?: Date;
};

type CountRow = {
  _id: string;
  count: number;
};

export type RssTrendSnapshot = {
  liveItems: RssPreviewItem[];
  sourceRows: CountRow[];
  topicRows: CountRow[];
  capturedAt?: Date;
};

function normalizeToken(token: string) {
  return token
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function extractTopicTokens(title: string) {
  return title
    .split(/[^\p{L}\p{N}]+/u)
    .map(normalizeToken)
    .filter((token) => token.length >= 4 && token.length <= 24)
    .filter((token) => !/^\d+$/.test(token))
    .filter((token) => !STOP_WORDS.has(token));
}

function toCountRows(counter: Map<string, number>, limit: number) {
  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ _id: key, count }));
}

export async function getRssTrendSnapshot(): Promise<RssTrendSnapshot> {
  const sources = [...getConfiguredRssSourceGroups(), ...(await getVoiranimeGenreSources())].slice(0, 10);
  const liveItems: RssPreviewItem[] = [];
  const sourceCounter = new Map<string, number>();
  const topicCounter = new Map<string, number>();

  await Promise.all(
    sources.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.feedUrl);
        const sourceLabel = source.sourceCategory || feed.title || new URL(source.feedUrl).hostname;
        const items = (feed.items || []).slice(0, 8);

        if (!items.length) {
          return;
        }

        sourceCounter.set(sourceLabel, (sourceCounter.get(sourceLabel) || 0) + items.length);

        for (const item of items) {
          const title = item.title?.trim();
          const url = item.link?.trim();
          if (!title || !url) {
            continue;
          }

          liveItems.push({
            title,
            url,
            sourceLabel,
            publishedAt: item.isoDate ? new Date(item.isoDate) : undefined,
          });

          for (const token of extractTopicTokens(title)) {
            topicCounter.set(token, (topicCounter.get(token) || 0) + 1);
          }
        }
      } catch {
        return;
      }
    }),
  );

  liveItems.sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));

  return {
    liveItems: liveItems.slice(0, 10),
    sourceRows: toCountRows(sourceCounter, 6),
    topicRows: toCountRows(topicCounter, 10).map((row) => ({
      _id: slugify(row._id).replace(/-/g, " ") || row._id,
      count: row.count,
    })),
    capturedAt: new Date(),
  };
}

export async function persistRssTrendSnapshot(snapshot: RssTrendSnapshot) {
  const capturedAt = snapshot.capturedAt || new Date();

  await TrendSnapshot.create({
    sourceRows: snapshot.sourceRows.map((row) => ({ label: row._id, count: row.count })),
    topicRows: snapshot.topicRows.map((row) => ({ label: row._id, count: row.count })),
    liveItems: snapshot.liveItems.map((item) => ({
      title: item.title,
      url: item.url,
      sourceLabel: item.sourceLabel,
      publishedAt: item.publishedAt,
    })),
    capturedAt,
  });

  await TrendSnapshot.deleteMany({
    _id: {
      $nin: (
        await TrendSnapshot.find({}).sort({ capturedAt: -1 }).limit(24).select({ _id: 1 }).lean()
      ).map((row) => row._id),
    },
  });
}

export async function getLatestPersistedTrendSnapshot() {
  const snapshot = await TrendSnapshot.findOne({}).sort({ capturedAt: -1 }).lean();
  if (!snapshot) {
    return null;
  }

  return {
    sourceRows: (snapshot.sourceRows || []).map((row) => ({ _id: row.label, count: row.count })),
    topicRows: (snapshot.topicRows || []).map((row) => ({ _id: row.label, count: row.count })),
    liveItems: (snapshot.liveItems || []).map((item) => ({
      title: item.title,
      url: item.url,
      sourceLabel: item.sourceLabel,
      publishedAt: item.publishedAt || undefined,
    })),
    capturedAt: snapshot.capturedAt,
  } satisfies RssTrendSnapshot;
}