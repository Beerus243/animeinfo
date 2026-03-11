"use client";

import { useState } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

type PublishButtonProps = {
  articleId: string;
  currentStatus: string;
};

export default function PublishButton({ articleId, currentStatus }: PublishButtonProps) {
  const { messages } = useLanguage();
  const [status, setStatus] = useState(currentStatus);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePublish() {
    setPending(true);
    setErrorMessage(null);

    const response = await fetch("/api/admin/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: articleId }),
    });

    setPending(false);
    if (response.ok) {
      setStatus("published");
      setErrorMessage(null);
      return;
    }

    try {
      const payload = await response.json();
      if (response.status === 401) {
        setErrorMessage(messages.publish.unauthorized);
      } else {
        setErrorMessage(payload?.error || messages.publish.failed);
      }
    } catch {
      setErrorMessage(response.status === 401 ? messages.publish.unauthorized : messages.publish.failed);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-sm uppercase tracking-[0.16em] text-muted">{status}</span>
        <button
          aria-label={status === "published" ? messages.publish.publishedAria : messages.publish.publishAria}
          className="button-primary"
          disabled={pending || status === "published"}
          id="publish-article-button"
          onClick={handlePublish}
          type="button"
        >
          {pending ? messages.publish.publishing : status === "published" ? messages.publish.published : messages.publish.publish}
        </button>
      </div>
      {errorMessage ? <p className="mt-3 text-sm text-warning">{errorMessage}</p> : null}
    </div>
  );
}