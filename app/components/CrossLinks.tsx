import Link from "next/link";

import type { Messages } from "@/lib/i18n/messages";

type CrossLinkItem = {
  href: string;
  label: string;
  description: string;
};

type CrossLinksProps = {
  messages: Messages["crossLinks"];
  /** Paths to exclude from the links (e.g. the current page) */
  exclude?: string[];
};

const ALL_LINKS: { key: keyof Messages["crossLinks"]; descKey: keyof Messages["crossLinks"]; href: string }[] = [
  { key: "articles", descKey: "articlesDesc", href: "/articles" },
  { key: "airing", descKey: "airingDesc", href: "/airing" },
  { key: "recommendations", descKey: "recommendationsDesc", href: "/recommendations" },
  { key: "trending", descKey: "trendingDesc", href: "/trending" },
  { key: "explore", descKey: "exploreDesc", href: "/explore" },
  { key: "categories", descKey: "categoriesDesc", href: "/categories" },
];

export default function CrossLinks({ messages, exclude = [] }: CrossLinksProps) {
  const links: CrossLinkItem[] = ALL_LINKS
    .filter((link) => !exclude.includes(link.href))
    .map((link) => ({
      href: link.href,
      label: messages[link.key],
      description: messages[link.descKey],
    }));

  if (!links.length) return null;

  return (
    <nav className="mt-8 panel px-5 py-6 md:mt-10 md:px-6 md:py-7" aria-label={messages.title}>
      <p className="eyebrow">{messages.eyebrow}</p>
      <h2 className="mt-2.5 font-display text-2xl font-semibold md:text-[1.7rem]">{messages.title}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="content-card p-4 transition-transform hover:-translate-y-0.5"
          >
            <h3 className="font-display text-base font-semibold">{link.label}</h3>
            <p className="mt-1.5 text-[13px] leading-6 text-muted">{link.description}</p>
          </Link>
        ))}
      </div>
    </nav>
  );
}
