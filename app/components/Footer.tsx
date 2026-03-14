import Link from "next/link";
import { Facebook, Instagram, MessageCircle, Music2, Send } from "lucide-react";

import BrandLogo from "@/app/components/BrandLogo";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";
import { getSocialLinks } from "@/lib/socialLinks";

function SocialIcon({ network }: { network: "whatsapp" | "telegram" | "facebook" | "instagram" | "tiktok" }) {
  switch (network) {
    case "whatsapp":
      return <MessageCircle size={18} strokeWidth={2} />;
    case "telegram":
      return <Send size={18} strokeWidth={2} />;
    case "facebook":
      return <Facebook size={18} strokeWidth={2} />;
    case "instagram":
      return <Instagram size={18} strokeWidth={2} />;
    case "tiktok":
      return <Music2 size={18} strokeWidth={2} />;
  }
}

export default async function Footer() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const socialLinks = getSocialLinks();

  return (
    <footer className="px-3 py-10">
      <div className="shell-container panel footer-panel grid gap-6 px-6 py-7 text-sm text-muted md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.72fr)_minmax(0,0.72fr)_minmax(0,0.95fr)] md:px-8 md:py-8">
        <div className="space-y-3">
          <p className="eyebrow">{messages.footer.tagline}</p>
          <div>
            <div className="flex items-center gap-3">
              <BrandLogo size="footer" />
              <p className="font-display text-2xl font-semibold text-foreground">{messages.footer.brand}</p>
            </div>
            <p className="mt-2 leading-6">{messages.footer.line1}</p>
          </div>
          <p className="max-w-xl leading-6">{messages.footer.line2}</p>
          <p className="max-w-xl text-[13px] leading-6">{messages.footer.note}</p>
        </div>

        <div>
          <p className="eyebrow">{messages.footer.browseLabel}</p>
          <nav className="mt-3 grid gap-2.5">
            <Link className="transition-colors hover:text-foreground" href="/articles">
              {messages.header.news}
            </Link>
            <Link className="transition-colors hover:text-foreground" href="/recommendations">
              {messages.recommendations.title}
            </Link>
            <Link className="transition-colors hover:text-foreground" href="/explore">
              {messages.header.explore}
            </Link>
          </nav>
        </div>

        <div>
          <p className="eyebrow">{messages.footer.followLabel}</p>
          <nav className="mt-3 grid gap-2.5">
            <Link className="transition-colors hover:text-foreground" href="/airing">
              {messages.header.airing}
            </Link>
            <Link className="transition-colors hover:text-foreground" href="/trending">
              {messages.header.trending}
            </Link>
            <Link className="transition-colors hover:text-foreground" href="/season">
              {messages.header.season}
            </Link>
          </nav>
        </div>

        <div>
          <p className="eyebrow">{messages.footer.socialLabel}</p>
          <p className="mt-3 text-[13px] leading-6">{messages.footer.socialHint}</p>
          <div className="social-grid mt-4">
            {socialLinks.map((social) => (
              social.href ? (
                <a
                  key={social.key}
                  className="social-link"
                  href={social.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="social-badge" aria-hidden="true">
                    <SocialIcon network={social.key} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{social.label}</span>
                    <span className="block text-[11px] text-muted">Compte officiel</span>
                  </span>
                </a>
              ) : (
                <div key={social.key} className="social-link social-link-muted" aria-hidden="true">
                  <span className="social-badge" aria-hidden="true">
                    <SocialIcon network={social.key} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{social.label}</span>
                    <span className="block text-[11px] text-muted">Bientot</span>
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}