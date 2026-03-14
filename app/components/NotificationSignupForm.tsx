"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { Locale, Messages } from "@/lib/i18n/messages";

type AnimeOption = {
  slug: string;
  title: string;
  releaseDay?: string;
  coverImage?: string;
};

type NotificationSignupFormProps = {
  animeOptions: AnimeOption[];
  locale: Locale;
  messages: Messages["notifications"];
  sourcePage: string;
  preselectedSlugs?: string[];
  compact?: boolean;
  maxVisible?: number;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(normalized);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

const PUSH_SELECTION_STORAGE_KEY = "animeinfo-push-selection";

export default function NotificationSignupForm({
  animeOptions,
  locale,
  messages,
  sourcePage,
  preselectedSlugs = [],
  compact = false,
  maxVisible,
}: NotificationSignupFormProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [pushPublicKey, setPushPublicKey] = useState("");
  const [pushConfigState, setPushConfigState] = useState<"loading" | "ready" | "missing">("loading");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(preselectedSlugs);
  const [pushPending, setPushPending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const selectedCount = selectedSlugs.length;
  const visibleOptions = useMemo(() => {
    const limit = compact ? 1 : maxVisible ?? 8;
    return animeOptions.slice(0, limit);
  }, [animeOptions, compact, maxVisible]);
  const browserPushSupported =
    isHydrated &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;
  const pushConfigured = Boolean(pushPublicKey);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPushConfig() {
      try {
        const response = await fetch("/api/notifications/push-config", { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));

        if (cancelled) {
          return;
        }

        if (response.ok && payload?.configured && typeof payload?.publicKey === "string" && payload.publicKey) {
          setPushPublicKey(payload.publicKey);
          setPushConfigState("ready");
          return;
        }

        setPushPublicKey("");
        setPushConfigState("missing");
      } catch {
        if (!cancelled) {
          setPushPublicKey("");
          setPushConfigState("missing");
        }
      }
    }

    void loadPushConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      const rawValue = window.localStorage.getItem(PUSH_SELECTION_STORAGE_KEY);
      if (!rawValue) {
        return;
      }

      const parsed = JSON.parse(rawValue);
      if (!Array.isArray(parsed)) {
        return;
      }

      const validSlugs = new Set(animeOptions.map((anime) => anime.slug));
      const nextSelection = parsed.filter((value): value is string => typeof value === "string" && validSlugs.has(value));

      if (nextSelection.length) {
        setSelectedSlugs(nextSelection);
      }
    } catch {
      window.localStorage.removeItem(PUSH_SELECTION_STORAGE_KEY);
    }
  }, [animeOptions, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(PUSH_SELECTION_STORAGE_KEY, JSON.stringify(selectedSlugs));
    } catch {
      // Ignore storage errors silently and keep the selection in memory only.
    }
  }, [isHydrated, selectedSlugs]);

  function toggleAnime(slug: string) {
    setSelectedSlugs((current) =>
      current.includes(slug) ? current.filter((value) => value !== slug) : [...current, slug],
    );
  }

  async function handlePushSubscribe() {
    if (!selectedCount) {
      setStatus({ type: "error", message: messages.error });
      return;
    }

    if (!browserPushSupported) {
      setStatus({ type: "error", message: messages.pushUnsupported });
      return;
    }

    if (!pushConfigured) {
      setStatus({ type: "error", message: messages.pushUnavailable });
      return;
    }

    setPushPending(true);
    setStatus(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus({ type: "error", message: messages.pushPermissionDenied });
        setPushPending(false);
        return;
      }

      const registration = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pushPublicKey),
      });

      const response = await fetch("/api/notifications/push-subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          animeSlugs: selectedSlugs,
          locale,
          sourcePage,
          subscription: subscription.toJSON(),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus({ type: "error", message: payload?.error || messages.error });
        setPushPending(false);
        return;
      }

      setStatus({
        type: "success",
        message: messages.pushSuccess.replace("{count}", String(payload?.count || selectedCount)),
      });
      setPushPending(false);
    } catch {
      setStatus({ type: "error", message: messages.error });
      setPushPending(false);
    }
  }

  if (!animeOptions.length) {
    return null;
  }

  const pushActionDisabled =
    pushPending ||
    selectedCount === 0 ||
    pushConfigState === "loading" ||
    !browserPushSupported ||
    !pushConfigured;

  function getFallbackLetter(title: string) {
    return title.trim().charAt(0).toUpperCase() || "A";
  }

  return (
    <div className="panel notification-panel p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">{messages.eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl font-semibold">{messages.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{messages.description}</p>
        </div>
        <span className="status-chip status-chip-success">{selectedCount} {messages.selectedSuffix}</span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3">
          {visibleOptions.map((anime) => {
            const checked = selectedSlugs.includes(anime.slug);

            return (
              <label
                key={anime.slug}
                className={`content-card notification-option rounded-3xl px-4 py-4 transition-colors ${checked ? "notification-option-active" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    checked={checked}
                    className="mt-0.5"
                    onChange={() => toggleAnime(anime.slug)}
                    type="checkbox"
                    value={anime.slug}
                  />
                  <div className="notification-option-thumb overflow-hidden">
                    {anime.coverImage ? (
                      <Image
                        alt={anime.title}
                        className="h-full w-full object-cover"
                        height={112}
                        src={anime.coverImage}
                        width={112}
                      />
                    ) : (
                      <div className="notification-option-thumb-fallback">
                        {getFallbackLetter(anime.title)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{anime.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {anime.releaseDay ? `${messages.releaseDayPrefix} ${anime.releaseDay}` : messages.releaseFallback}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="content-card space-y-4 rounded-3xl p-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{messages.pushSetupTitle}</p>
            <p className="text-sm leading-7 text-muted">{messages.pushSetupDescription}</p>
          </div>
          <button className="button-primary w-full" disabled={pushActionDisabled} onClick={() => void handlePushSubscribe()} type="button">
            {pushPending ? messages.pushPending : messages.pushSubmit}
          </button>
          <p className="text-sm leading-7 text-muted">{messages.legalHint}</p>
          {isHydrated && !browserPushSupported ? <p className="text-sm leading-7 text-muted">{messages.pushUnsupported}</p> : null}
          {pushConfigState === "missing" ? <p className="text-sm leading-7 text-muted">{messages.pushUnavailable}</p> : null}
          {status ? (
            <p className={`text-sm ${status.type === "success" ? "text-success" : "text-warning"}`}>{status.message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}