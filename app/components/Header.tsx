import Link from "next/link";
import { cookies } from "next/headers";

import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import ThemeToggle from "@/app/components/ThemeToggle";
import { adminSessionCookieName, verifyAdminSession } from "@/lib/adminAuth";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";

export default async function Header() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(adminSessionCookieName)?.value;
  const isAdmin = await verifyAdminSession(sessionValue);
  const links = [
    { href: "/", label: messages.header.home },
    { href: "/articles", label: messages.header.news },
    { href: "/airing", label: messages.header.airing },
    { href: "/explore", label: messages.header.explore },
    ...(isAdmin ? [{ href: "/admin", label: messages.header.dashboard }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 px-3 py-3 backdrop-blur-sm" role="banner">
      <div className="shell-container panel px-4 py-4 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3" aria-label={messages.header.homeAria}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                AI
              </span>
              <div>
                <p className="font-display text-xl font-semibold">AnimeInfo</p>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">{messages.header.tagline}</p>
              </div>
            </Link>
            <div className="flex items-center gap-3 md:hidden">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium" aria-label="Navigation principale">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-muted transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}