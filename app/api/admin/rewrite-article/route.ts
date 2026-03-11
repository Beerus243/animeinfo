import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { getRewriteConfig, rewriteArticleFields } from "@/lib/articleTranslation";

type RewritePayload = {
  locale?: "fr" | "en";
  fields?: {
    title?: string;
    excerpt?: string;
    content?: string;
    seo?: {
      metaTitle?: string;
      metaDesc?: string;
    };
  };
};

function hasSourceContent(payload: RewritePayload) {
  const fields = payload.fields;
  return Boolean(
    fields && [fields.title, fields.excerpt, fields.content, fields.seo?.metaTitle, fields.seo?.metaDesc].some((value) => value?.trim()),
  );
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getRewriteConfig()) {
    return NextResponse.json({ error: "AI rewrite is not configured." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => ({}))) as RewritePayload;
  if (!payload.locale) {
    return NextResponse.json({ error: "Missing target locale." }, { status: 400 });
  }

  if (!hasSourceContent(payload)) {
    return NextResponse.json({ error: "Missing source article content." }, { status: 400 });
  }

  try {
    const rewrite = await rewriteArticleFields({
      locale: payload.locale,
      fields: {
        title: payload.fields?.title,
        excerpt: payload.fields?.excerpt,
        content: payload.fields?.content,
        seo: {
          metaTitle: payload.fields?.seo?.metaTitle,
          metaDesc: payload.fields?.seo?.metaDesc,
        },
      },
    });

    return NextResponse.json({ ok: true, rewrite });
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Automatic rewrite is unavailable right now.";
    const status = message.startsWith("Translation provider error:") || message.includes("invalid response") ? 502 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}