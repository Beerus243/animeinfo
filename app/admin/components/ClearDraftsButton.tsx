"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ClearDraftsButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  successLabel: string;
  emptyLabel: string;
  failedLabel: string;
  confirmLabel: string;
};

export default function ClearDraftsButton({
  idleLabel,
  pendingLabel,
  successLabel,
  emptyLabel,
  failedLabel,
  confirmLabel,
}: ClearDraftsButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleClearDrafts() {
    if (!window.confirm(confirmLabel)) {
      return;
    }

    setPending(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/clear-drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const payload = await response.json().catch(() => ({}));
      setPending(false);

      if (!response.ok) {
        setStatus(payload?.error || failedLabel);
        return;
      }

      const deletedCount = Number(payload?.deletedCount || 0);
      setStatus(deletedCount > 0 ? successLabel.replace("{count}", String(deletedCount)) : emptyLabel);
      router.refresh();
    } catch {
      setPending(false);
      setStatus(failedLabel);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="button-secondary" disabled={pending} onClick={() => void handleClearDrafts()} type="button">
        {pending ? pendingLabel : idleLabel}
      </button>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </div>
  );
}