import { NextRequest, NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { connectToDatabase } from "@/lib/mongodb";
import { isFrenchAiPipelineConfigured, processStoredArticleToFrenchFirst } from "@/lib/articleTranslation";
import Article from "@/models/Article";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFrenchAiPipelineConfigured()) {
    return NextResponse.json({ error: "AI translation or rewriting is not configured." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => ({}))) as { limit?: number };
  const limit = Math.min(Math.max(Number(payload.limit || 10) || 10, 1), 50);

  await connectToDatabase();
  const drafts = await Article.find({ status: { $in: ["draft", "review"] } })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  let processed = 0;
  const failures: Array<{ id: string; title: string; error: string }> = [];

  for (const draft of drafts) {
    try {
      await processStoredArticleToFrenchFirst(draft);
      processed += 1;
    } catch (error) {
      await Article.updateOne(
        { _id: draft._id },
        {
          $set: {
            aiStatus: "failed",
            aiError: error instanceof Error ? error.message : "Unknown AI processing error",
            aiProcessedAt: new Date(),
          },
        },
      );
      failures.push({
        id: draft._id.toString(),
        title: draft.title || "Untitled",
        error: error instanceof Error ? error.message : "Unknown AI processing error",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    selected: drafts.length,
    processed,
    failures,
  });
}