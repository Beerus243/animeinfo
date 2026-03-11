import "server-only";

import { type Locale } from "@/lib/i18n/messages";

export async function getServerLocale(): Promise<Locale> {
  return "fr";
}