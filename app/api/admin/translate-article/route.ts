import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { getTranslationConfig, translateArticleFields } from "@/lib/articleTranslation";

type TranslationPayload = {
  sourceLocale?: "fr" | "en";
  targetLocale?: "fr" | "en";
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

function hasSourceContent(payload: TranslationPayload) {
  const fields = payload.fields;
  return Boolean(
    fields && [fields.title, fields.excerpt, fields.content, fields.seo?.metaTitle, fields.seo?.metaDesc].some((value) => value?.trim()),
  );
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getTranslationConfig();
  if (!config) {
    return NextResponse.json({ error: "Translation API is not configured." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => ({}))) as TranslationPayload;
  if (!payload.sourceLocale || !payload.targetLocale || payload.sourceLocale === payload.targetLocale) {
    return NextResponse.json({ error: "Invalid source or target locale." }, { status: 400 });
  }

  if (!hasSourceContent(payload)) {
    return NextResponse.json({ error: "Missing source article content." }, { status: 400 });
  }

  try {
    const translation = await translateArticleFields({
      sourceLocale: payload.sourceLocale,
      targetLocale: payload.targetLocale,
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

    return NextResponse.json({ ok: true, translation });
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Automatic translation is unavailable right now.";
    const status = message.startsWith("Translation provider error:") || message.includes("invalid response") ? 502 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}