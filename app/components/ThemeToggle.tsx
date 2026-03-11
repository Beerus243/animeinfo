"use client";

import { useSyncExternalStore } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

type ThemeMode = "light" | "dark";

const storageKey = "animeinfo-theme";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): ThemeMode {
  const saved = window.localStorage.getItem(storageKey);
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

type ThemeToggleProps = {
  compact?: boolean;
};

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light");
  const { messages } = useLanguage();

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(storageKey, nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.dataset.theme = nextTheme;
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <button
      aria-label={theme === "dark" ? messages.theme.toLight : messages.theme.toDark}
      className={`button-secondary ${compact ? "min-w-9 px-2.5 text-[13px]" : "min-w-10 px-3.5"}`}
      onClick={toggleTheme}
      type="button"
    >
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
      <span className={compact ? "hidden" : "hidden sm:inline"}>{theme === "dark" ? messages.theme.light : messages.theme.dark}</span>
    </button>
  );
}