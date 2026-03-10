"use client";

import { useSyncExternalStore } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

type ArticleExperienceControlsProps = {
  title: string;
};

function subscribe(callback: () => void) {
  window.addEventListener("reading-mode-changed", callback);
  return () => window.removeEventListener("reading-mode-changed", callback);
}

function getSnapshot() {
  return document.documentElement.dataset.readingMode === "true";
}

export default function ArticleExperienceControls({ title }: ArticleExperienceControlsProps) {
  const readingMode = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const { messages } = useLanguage();

  function toggleReadingMode() {
    const nextValue = !readingMode;
    document.documentElement.dataset.readingMode = String(nextValue);
    window.dispatchEvent(new Event("reading-mode-changed"));
  }

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }

    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="article-measure mt-6 flex flex-wrap gap-3 reading-hide lg:sticky lg:top-28">
      <button
        aria-label={readingMode ? messages.reading.disableAria : messages.reading.enableAria}
        className="button-secondary"
        onClick={toggleReadingMode}
        type="button"
      >
        {readingMode ? messages.reading.disable : messages.reading.enable}
      </button>
      <button aria-label={messages.reading.shareAria} className="button-secondary" onClick={handleShare} type="button">
        {messages.reading.share}
      </button>
    </div>
  );
}