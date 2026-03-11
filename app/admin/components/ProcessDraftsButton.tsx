"use client";

import { useState } from "react";

type ProcessDraftsButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  successLabel: string;
  emptyLabel: string;
  failedLabel: string;
};

export default function ProcessDraftsButton({
  idleLabel,
  pendingLabel,
  successLabel,
  emptyLabel,
  failedLabel,
}: ProcessDraftsButtonProps) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleProcess() {
    setPending(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/process-drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit: 20 }),
      });
      const payload = await response.json().catch(() => ({}));
      setPending(false);

      if (!response.ok) {
        setStatus(payload?.error || failedLabel);
        return;
      }

      if ((payload?.selected || 0) === 0) {
        setStatus(emptyLabel);
        return;
      }

      const baseStatus = successLabel
        .replace("{processed}", String(payload?.processed || 0))
        .replace("{selected}", String(payload?.selected || 0));

      if (Array.isArray(payload?.failures) && payload.failures.length) {
        setStatus(`${baseStatus} (${payload.failures.length} erreur(s))`);
        return;
      }

      setStatus(baseStatus);
    } catch {
      setPending(false);
      setStatus(failedLabel);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="button-secondary" disabled={pending} onClick={() => void handleProcess()} type="button">
        {pending ? pendingLabel : idleLabel}
      </button>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </div>
  );
}