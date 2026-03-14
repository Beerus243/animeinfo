"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { getMessages, type Locale, type Messages } from "@/lib/i18n/messages";

type LanguageContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  initialLocale: Locale;
  children: React.ReactNode;
};

const localeStorageKey = "mangaempire-locale";
const legacyLocaleStorageKey = "animeinfo-locale";
const localeCookieName = "mangaempire-locale";

export default function LanguageProvider({ initialLocale, children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    messages: getMessages(locale),
    setLocale(nextLocale) {
      window.localStorage.setItem(localeStorageKey, nextLocale);
      window.localStorage.removeItem(legacyLocaleStorageKey);
      document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
      document.cookie = `animeinfo-locale=; path=/; max-age=0; samesite=lax`;
      document.documentElement.lang = nextLocale;
      setLocaleState(nextLocale);
      window.location.reload();
    },
  }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }

  return context;
}