"use client";

import { useState, useSyncExternalStore } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

const consentStorageKey = "mangaempire-consent";
const legacyConsentStorageKey = "animeinfo-consent";

export default function ConsentBanner() {
  const { messages } = useLanguage();
  const [override, setOverride] = useState<"granted" | "denied" | null | undefined>(undefined);
  const storedConsent = useSyncExternalStore(
    () => () => undefined,
    () => (window.localStorage.getItem(consentStorageKey) || window.localStorage.getItem(legacyConsentStorageKey)) as "granted" | "denied" | null,
    () => null,
  );
  const consent = override ?? storedConsent;

  async function handleConsent(status: "granted" | "denied") {
    window.localStorage.setItem(consentStorageKey, status);
    window.localStorage.removeItem(legacyConsentStorageKey);
    setOverride(status);

    await fetch("/api/ads/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  if (consent) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 md:left-auto md:max-w-lg">
      <div className="panel space-y-4 p-5">
        <p className="eyebrow">{messages.consent.eyebrow}</p>
        <h2 className="font-display text-2xl font-semibold">{messages.consent.title}</h2>
        <p className="text-sm leading-7 text-muted">
          {messages.consent.description}
        </p>
        <div className="flex gap-3">
          <button className="button-primary" onClick={() => handleConsent("granted")} type="button">
            {messages.consent.accept}
          </button>
          <button className="button-secondary" onClick={() => handleConsent("denied")} type="button">
            {messages.consent.deny}
          </button>
        </div>
      </div>
    </div>
  );
}