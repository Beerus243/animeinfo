"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

type DraftKind = {
  key: string;
  label: string;
  section: "news" | "recommendation";
  recommendationType?: "anime" | "manga";
  variant: "primary" | "secondary";
};

export default function CreateDraftButtons() {
  const router = useRouter();
  const { messages } = useLanguage();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const draftKinds: DraftKind[] = [
    {
      key: "article",
      label: messages.admin.createArticle,
      section: "news",
      variant: "primary",
    },
    {
      key: "recommendation-anime",
      label: messages.admin.createAnimeRecommendation,
      section: "recommendation",
      recommendationType: "anime",
      variant: "secondary",
    },
    {
      key: "recommendation-manga",
      label: messages.admin.createMangaRecommendation,
      section: "recommendation",
      recommendationType: "manga",
      variant: "secondary",
    },
  ];

  async function handleCreateDraft(kind: DraftKind) {
    setPendingKey(kind.key);

    try {
      const response = await fetch("/api/admin/create-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: kind.section,
          recommendationType: kind.recommendationType,
        }),
      });

      if (!response.ok) {
        setPendingKey(null);
        return;
      }

      const payload = await response.json();
      router.push(`/admin/edit/${payload.articleId}`);
      router.refresh();
    } catch {
      setPendingKey(null);
    }
  }

  return (
    <>
      {draftKinds.map((kind) => (
        <button
          key={kind.key}
          className={kind.variant === "primary" ? "button-primary" : "button-secondary"}
          disabled={pendingKey !== null}
          onClick={() => void handleCreateDraft(kind)}
          type="button"
        >
          {pendingKey === kind.key ? messages.admin.creatingDraft : kind.label}
        </button>
      ))}
    </>
  );
}