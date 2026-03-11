import Link from "next/link";
import { cookies } from "next/headers";

import MobileNav from "@/app/components/MobileNav";
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
      <div className="shell-container panel px-4 py-3 md:px-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5" aria-label={messages.header.homeAria}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background shadow-[inset_0_-1px_0_rgba(255,255,255,0.15)]">
                AI
              </span>
              <div>
                <p className="font-display text-lg font-semibold md:text-xl">AnimeInfo</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted md:text-xs">{messages.header.tagline}</p>
              </div>
            </Link>
            <MobileNav ariaLabel="Navigation principale" links={links} />
          </div>
          <nav className="hidden flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-semibold md:flex" aria-label="Navigation principale">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full px-3 py-2 text-muted transition-colors hover:bg-accent-soft hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}