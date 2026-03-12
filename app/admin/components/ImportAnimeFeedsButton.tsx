"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

type ImportAnimeFeedsButtonProps = {
  mode?: "all" | "icotaku-refresh";
  idleLabel?: string;
  pendingLabel?: string;
  successLabel?: string;
  emptyLabel?: string;
  failedLabel?: string;
};

export default function ImportAnimeFeedsButton({
  mode = "all",
  idleLabel,
  pendingLabel,
  successLabel,
  emptyLabel,
  failedLabel,
}: ImportAnimeFeedsButtonProps) {
  const router = useRouter();
  const { messages } = useLanguage();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleImport() {
    setPending(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/import-anime-feeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode }),
      });
      const payload = await response.json().catch(() => ({}));
      setPending(false);

      if (!response.ok) {
        setStatus(payload?.error || failedLabel || messages.adminAnime.importFailed);
        return;
      }

      if (payload?.totalItems === 0) {
        setStatus(emptyLabel || messages.adminAnime.importEmpty);
        return;
      }

      const baseLabel = successLabel || messages.adminAnime.importSuccess;
      setStatus(baseLabel
        .replace("{imported}", String(payload?.imported || 0))
        .replace("{updated}", String(payload?.updated || 0))
        .replace("{removed}", String(payload?.removed || 0)));
      router.refresh();
    } catch {
      setPending(false);
      setStatus(failedLabel || messages.adminAnime.importFailed);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="button-secondary" disabled={pending} onClick={() => void handleImport()} type="button">
        {pending ? (pendingLabel || messages.adminAnime.importing) : (idleLabel || messages.adminAnime.importFeeds)}
      </button>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </div>
  );
}