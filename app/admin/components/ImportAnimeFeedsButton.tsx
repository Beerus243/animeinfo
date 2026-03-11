"use client";

import { useState } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

export default function ImportAnimeFeedsButton() {
  const { messages } = useLanguage();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleImport() {
    setPending(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/import-anime-feeds", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      setPending(false);

      if (!response.ok) {
        setStatus(payload?.error || messages.adminAnime.importFailed);
        return;
      }

      if (payload?.totalItems === 0) {
        setStatus(messages.adminAnime.importEmpty);
        return;
      }

      setStatus(
        messages.adminAnime.importSuccess
          .replace("{imported}", String(payload?.imported || 0))
          .replace("{updated}", String(payload?.updated || 0)),
      );
    } catch {
      setPending(false);
      setStatus(messages.adminAnime.importFailed);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="button-secondary" disabled={pending} onClick={() => void handleImport()} type="button">
        {pending ? messages.adminAnime.importing : messages.adminAnime.importFeeds}
      </button>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </div>
  );
}