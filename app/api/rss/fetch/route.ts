import { NextRequest, NextResponse } from "next/server";

import { fetchRssFeed } from "@/lib/rssParser";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing `url` query parameter." }, { status: 400 });
  }

  try {
    const items = await fetchRssFeed(url);
    return NextResponse.json({ ok: true, count: items.length, items: items.slice(0, 10) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch RSS feed." },
      { status: 500 },
    );
  }
}