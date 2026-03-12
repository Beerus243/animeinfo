import Link from "next/link";
import { cookies } from "next/headers";

import MobileNav from "@/app/components/MobileNav";
import NavLinks from "@/app/components/NavLinks";
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
    { href: "/articles", label: messages.header.news },
    { href: "/airing", label: messages.header.airing },
    { href: "/recommendations", label: messages.recommendations.eyebrow },
    ...(isAdmin ? [{ href: "/admin", label: messages.header.dashboard }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 px-2.5 py-2.5 backdrop-blur-sm" role="banner">
      <div className="shell-container panel px-3.5 py-2.5 md:px-4.5">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2" aria-label={messages.header.homeAria}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background shadow-[inset_0_-1px_0_rgba(255,255,255,0.15)]">
                AI
              </span>
              <div>
                <p className="font-display text-base font-semibold md:text-lg">AnimeInfo</p>
                <p className="text-[9px] uppercase tracking-[0.14em] text-muted md:text-[10px]">{messages.header.tagline}</p>
              </div>
            </Link>
            <MobileNav
              ariaLabel="Navigation principale"
              closeLabel={messages.header.menuClose}
              description={messages.header.mobileDescription}
              links={links}
              openLabel={messages.header.menuOpen}
              title={messages.header.mobileTitle}
            />
          </div>
          <NavLinks links={links} />
          <div className="hidden items-center gap-1.5 md:flex">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}