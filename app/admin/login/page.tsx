import BrandLogo from "@/app/components/BrandLogo";
import AdminLoginForm from "@/app/admin/components/AdminLoginForm";
import { getMessages } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";

export default async function AdminLoginPage() {
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return (
    <div className="shell-container py-8 md:py-12">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <section className="panel flex flex-col justify-between gap-8 overflow-hidden px-6 py-8 md:px-8 md:py-10">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <BrandLogo size="footer" />
              <div>
                <p className="font-display text-xl font-semibold text-foreground">Manga Empire</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Admin access</p>
              </div>
            </div>
            <span className="eyebrow">{messages.adminLogin.eyebrow}</span>
            <h1 className="font-display text-4xl font-semibold md:text-5xl">{messages.adminLogin.title}</h1>
            <p className="max-w-xl text-base leading-8 text-muted">{messages.adminLogin.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-line bg-white/55 p-5 dark:bg-white/5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">{messages.adminLogin.portalOpsTitle}</p>
              <p className="mt-3 text-sm leading-7 text-muted">{messages.adminLogin.portalOpsDescription}</p>
            </div>
            <div className="rounded-3xl border border-line bg-white/55 p-5 dark:bg-white/5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">{messages.adminLogin.portalSecurityTitle}</p>
              <p className="mt-3 text-sm leading-7 text-muted">{messages.adminLogin.securityHint}</p>
            </div>
          </div>
        </section>
        <AdminLoginForm />
      </div>
    </div>
  );
}