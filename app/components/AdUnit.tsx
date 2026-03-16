"use client";

import { useEffect, useSyncExternalStore } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";
import { adSlots } from "@/lib/ads";

type AdUnitProps = {
  slot: keyof typeof adSlots;
  compact?: boolean;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const consentStorageKey = "mangaempire-consent";
const legacyConsentStorageKey = "animeinfo-consent";

export default function AdUnit({ slot, compact = false }: AdUnitProps) {
  const config = adSlots[slot];
  const { messages } = useLanguage();
  const rootClassName = [
    "ad-unit",
    "panel",
    "p-4",
    compact ? "ad-unit-compact min-h-28" : "min-h-56",
    slot === "header" ? "ad-unit-header" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const consent = useSyncExternalStore(
    () => () => undefined,
    () => (window.localStorage.getItem(consentStorageKey) || window.localStorage.getItem(legacyConsentStorageKey)) === "granted",
    () => false,
  );

  useEffect(() => {
    if (!consent || !process.env.NEXT_PUBLIC_ADSENSE_CLIENT || typeof window === "undefined") {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ignore client-side ad initialization issues during development.
    }
  }, [consent]);

  return (
    <div className={rootClassName}>
      <div className="ad-unit-meta mb-3 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted">
        <span>{messages.adUnit.adLabel} · {config.label}</span>
        <span>{consent ? messages.adUnit.enabled : messages.adUnit.consentRequired}</span>
      </div>
      {consent && process.env.NEXT_PUBLIC_ADSENSE_CLIENT ? (
        <ins
          className="adsbygoogle ad-unit-frame block h-full w-full rounded-2xl"
          style={{ display: "block" }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
          data-ad-format="auto"
          data-ad-slot={config.slotId}
          data-full-width-responsive="true"
        />
      ) : (
        <div className="ad-unit-placeholder flex h-full min-h-32 items-center justify-center rounded-2xl border border-dashed border-line bg-surface-strong text-center text-sm text-muted">
          {messages.adUnit.configure}
        </div>
      )}
    </div>
  );
}