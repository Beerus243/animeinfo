import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";

export default async function Footer() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return (
    <footer className="px-3 py-10">
      <div className="shell-container panel flex flex-col gap-4 px-6 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p>{messages.footer.line1}</p>
        <p>{messages.footer.line2}</p>
      </div>
    </footer>
  );
}