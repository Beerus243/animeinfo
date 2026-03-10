import "server-only";

import { cookies } from "next/headers";

import { type Locale, isLocale } from "@/lib/i18n/messages";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("animeinfo-locale")?.value;
  return isLocale(locale) ? locale : "fr";
}