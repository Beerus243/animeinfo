"use client";

import { useState } from "react";

type ImportRecommendationsButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  successLabel: string;
  emptyLabel: string;
  failedLabel: string;
};

export default function ImportRecommendationsButton({
  idleLabel,
  pendingLabel,
  successLabel,
  emptyLabel,
  failedLabel,
}: ImportRecommendationsButtonProps) {
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
        setStatus(payload?.error || failedLabel);
        return;
      }

      if ((payload?.processedItems || 0) === 0) {
        setStatus(emptyLabel);
        return;
      }

      setStatus(
        successLabel
          .replace("{imported}", String(payload?.imported || 0))
          .replace("{duplicates}", String(payload?.duplicates || 0)),
      );
    } catch {
      setPending(false);
      setStatus(failedLabel);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="button-secondary" disabled={pending} onClick={() => void handleImport()} type="button">
        {pending ? pendingLabel : idleLabel}
      </button>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </div>
  );
}