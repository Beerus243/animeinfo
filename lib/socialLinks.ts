export type SocialLink = {
  key: "whatsapp" | "telegram" | "facebook" | "instagram" | "tiktok";
  label: string;
  href?: string;
  configured: boolean;
};

const SOCIAL_CONFIG = [
  { key: "whatsapp", label: "WhatsApp", shortLabel: "WA", envKey: "SOCIAL_WHATSAPP_URL" },
  { key: "telegram", label: "Telegram", shortLabel: "TG", envKey: "SOCIAL_TELEGRAM_URL" },
  { key: "facebook", label: "Facebook", shortLabel: "FB", envKey: "SOCIAL_FACEBOOK_URL" },
  { key: "instagram", label: "Instagram", shortLabel: "IG", envKey: "SOCIAL_INSTAGRAM_URL" },
  { key: "tiktok", label: "TikTok", shortLabel: "TT", envKey: "SOCIAL_TIKTOK_URL" },
] as const;

export function getSocialLinks(): SocialLink[] {
  return SOCIAL_CONFIG.map((item) => {
    const href = process.env[item.envKey]?.trim();
    return {
      key: item.key,
      label: item.label,
      href: href || undefined,
      configured: Boolean(href),
    };
  });
}

export function getSocialSameAs(): string[] {
  return getSocialLinks().flatMap((item) => (item.href ? [item.href] : []));
}