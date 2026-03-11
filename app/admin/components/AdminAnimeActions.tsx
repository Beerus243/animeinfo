"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ImportAnimeFeedsButton from "@/app/admin/components/ImportAnimeFeedsButton";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function AdminAnimeActions() {
  const router = useRouter();
  const { messages } = useLanguage();
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleCreateAnime() {
    setCreating(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/admin/create-anime", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setCreating(false);
        setStatusMessage(payload?.error || messages.adminAnime.createFailed);
        return;
      }

      router.push(`/admin/anime/${payload.animeId}`);
      router.refresh();
    } catch {
      setCreating(false);
      setStatusMessage(messages.adminAnime.createFailed);
    }
  }

  async function handleSendAlerts() {
    setSending(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/admin/send-release-alerts", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      setSending(false);

      if (!response.ok) {
        setStatusMessage(payload?.error || messages.adminAnime.alertSendFailed);
        return;
      }

      setStatusMessage(messages.adminAnime.alertSendSuccess.replace("{count}", String(payload?.sent || 0)));
    } catch {
      setSending(false);
      setStatusMessage(messages.adminAnime.alertSendFailed);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="button-primary" disabled={creating} onClick={() => void handleCreateAnime()} type="button">
        {creating ? messages.adminAnime.creating : messages.adminAnime.create}
      </button>
      <ImportAnimeFeedsButton />
      <button className="button-secondary" disabled={sending} onClick={() => void handleSendAlerts()} type="button">
        {sending ? messages.adminAnime.sendingAlerts : messages.adminAnime.sendAlerts}
      </button>
      {statusMessage ? <p className="text-sm text-muted">{statusMessage}</p> : null}
    </div>
  );
}