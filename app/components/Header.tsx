import Link from "next/link";

import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import ThemeToggle from "@/app/components/ThemeToggle";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";

export default async function Header() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const links = [
    { href: "/news", label: messages.header.news },
    { href: "/category/releases", label: messages.header.releases },
  ];

  return (
    <header className="sticky top-0 z-30 px-3 py-3 backdrop-blur-sm" role="banner">
      <div className="shell-container panel flex items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label={messages.header.homeAria}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
            AI
          </span>
          <div>
            <p className="font-display text-xl font-semibold">AnimeInfo</p>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{messages.header.tagline}</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Navigation principale">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}