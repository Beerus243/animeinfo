"use client";

import { useState } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

export default function ImportRecommendationsButton() {
  const { messages } = useLanguage();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleImport() {
    setPending(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/import-recommendations", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      setPending(false);

      if (!response.ok) {
        setStatus(payload?.error || messages.admin.importRecommendationsFailed);
        return;
      }

      if ((payload?.processedItems || 0) === 0) {
        setStatus(messages.admin.importRecommendationsEmpty);
        return;
      }

      setStatus(
        messages.admin.importRecommendationsSuccess
          .replace("{imported}", String(payload?.imported || 0))
          .replace("{duplicates}", String(payload?.duplicates || 0)),
      );
    } catch {
      setPending(false);
      setStatus(messages.admin.importRecommendationsFailed);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="button-secondary" disabled={pending} onClick={() => void handleImport()} type="button">
        {pending ? messages.admin.importingRecommendations : messages.admin.importRecommendations}
      </button>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </div>
  );
}