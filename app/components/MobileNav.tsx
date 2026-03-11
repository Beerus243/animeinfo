"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import ThemeToggle from "@/app/components/ThemeToggle";

type MobileNavProps = {
  links: Array<{ href: string; label: string }>;
  ariaLabel: string;
};

export default function MobileNav({ links, ariaLabel }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-expanded={open}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className="nav-icon-button"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? <X size={18} strokeWidth={2.25} /> : <Menu size={18} strokeWidth={2.25} />}
      </button>

      {open ? (
        <div className="mt-4 rounded-[1.25rem] border border-line bg-surface-strong/95 p-4 shadow-[0_18px_40px_var(--shadow)] backdrop-blur-xl">
          <nav aria-label={ariaLabel} className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent-soft"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle compact />
          </div>
        </div>
      ) : null}
    </div>
  );
}