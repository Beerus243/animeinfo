"use client";

import { useLanguage } from "@/app/components/LanguageProvider";
import { type Locale } from "@/lib/i18n/messages";

const options: Array<{ locale: Locale; flag: string }> = [
  { locale: "fr", flag: "🇫🇷" },
  { locale: "en", flag: "🇬🇧" },
];

export default function LanguageSwitcher() {
  const { locale, messages, setLocale } = useLanguage();
  const activeOption = options.find((option) => option.locale === locale) ?? options[0];

  return (
    <label className="relative inline-flex min-w-40 items-center" htmlFor="language-switcher">
      <span className="sr-only">{messages.localeLabel}</span>
      <span aria-hidden="true" className="pointer-events-none absolute left-4 text-base">
        {activeOption.flag}
      </span>
      <select
        aria-label={messages.localeLabel}
        className="button-secondary w-full appearance-none pl-11 pr-10"
        id="language-switcher"
        onChange={(event) => setLocale(event.target.value as Locale)}
        value={locale}
      >
        {options.map((option) => (
          <option key={option.locale} value={option.locale}>
            {`${option.flag} ${messages.locales[option.locale]}`}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-4 text-xs text-muted">
        ▾
      </span>
    </label>
  );
}