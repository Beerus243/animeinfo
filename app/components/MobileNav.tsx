"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import ThemeToggle from "@/app/components/ThemeToggle";

type MobileNavProps = {
  links: Array<{ href: string; label: string }>;
  ariaLabel: string;
};

export default function MobileNav({ links, ariaLabel }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [open]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (open) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function isActivePath(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="md:hidden">
      <button
        aria-expanded={open}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className={open ? "nav-icon-button nav-icon-button-active" : "nav-icon-button"}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? <X size={17} strokeWidth={2.25} /> : <Menu size={17} strokeWidth={2.25} />}
      </button>

      {open ? <button aria-label="Fermer le menu" className="mobile-nav-backdrop" onClick={() => setOpen(false)} type="button" /> : null}

      <div
        aria-hidden={!open}
        className={`mobile-nav-panel ${open ? "mobile-nav-panel-open" : "mobile-nav-panel-closed"}`}
      >
        <div className="mobile-nav-surface">
          <div className="flex items-start justify-between gap-3 border-b border-line/80 pb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">AnimeInfo</p>
              <p className="mt-1 text-base font-semibold text-foreground">Navigation</p>
              <p className="mt-1 text-[13px] text-muted">Acces rapide aux sections principales.</p>
            </div>
            <button aria-label="Fermer le menu" className="nav-icon-button" onClick={() => setOpen(false)} type="button">
              <X size={17} strokeWidth={2.25} />
            </button>
          </div>
          <nav aria-label={ariaLabel} className="mt-4 flex flex-col gap-2">
            {links.map((link, index) => (
              <Link
                aria-current={isActivePath(link.href) ? "page" : undefined}
                key={link.href}
                href={link.href}
                className={isActivePath(link.href) ? "mobile-nav-link mobile-nav-link-active" : "mobile-nav-link"}
                onClick={() => setOpen(false)}
                style={{ transitionDelay: open ? `${index * 28}ms` : "0ms" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-1.5 border-t border-line/80 pt-4">
            <ThemeToggle compact />
          </div>
        </div>
      </div>
    </div>
  );
}