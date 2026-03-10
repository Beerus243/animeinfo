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

export default function LanguageProvider({ initialLocale, children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    messages: getMessages(locale),
    setLocale(nextLocale) {
      window.localStorage.setItem("animeinfo-locale", nextLocale);
      document.cookie = `animeinfo-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
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