import Link from "next/link";

import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";

export default async function Footer() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return (
    <footer className="px-3 py-10">
      <div className="shell-container panel grid gap-8 px-6 py-7 text-sm text-muted md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] md:px-8 md:py-8">
        <div className="space-y-3">
          <p className="eyebrow">{messages.footer.tagline}</p>
          <div>
            <p className="font-display text-2xl font-semibold text-foreground">{messages.footer.brand}</p>
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
      </div>
    </footer>
  );
}