"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkItem = {
  href: string;
  label: string;
};

type NavLinksProps = {
  links: NavLinkItem[];
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavLinks({ links }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] font-semibold md:flex" aria-label="Navigation principale">
      {links.map((link) => {
        const active = isActivePath(pathname, link.href);

        return (
          <Link
            key={link.href}
            aria-current={active ? "page" : undefined}
            href={link.href}
            className={active ? "nav-link nav-link-active" : "nav-link"}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}