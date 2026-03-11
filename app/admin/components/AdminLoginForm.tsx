"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useLanguage } from "@/app/components/LanguageProvider";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { messages } = useLanguage();
  const redirectTarget = searchParams.get("redirect") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrorMessage(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setPending(false);

    if (!response.ok) {
      setErrorMessage(messages.adminLogin.invalidCredentials);
      return;
    }

    router.push(redirectTarget);
    router.refresh();
  }

  return (
    <form className="panel mx-auto flex max-w-xl flex-col gap-5 px-6 py-8 md:px-8 md:py-10" onSubmit={handleSubmit}>
      <div className="space-y-3">
        <p className="eyebrow">{messages.adminLogin.eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl font-semibold">{messages.adminLogin.title}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">{messages.adminLogin.description}</p>
      </div>
      <div className="rounded-[1.75rem] border border-line bg-white/60 p-4 dark:bg-white/5">
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">{messages.adminLogin.emailLabel}</span>
            <input
              autoComplete="username"
              className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 dark:bg-background/70"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={messages.adminLogin.emailPlaceholder}
              type="email"
              value={email}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">{messages.adminLogin.passwordLabel}</span>
            <input
              autoComplete="current-password"
              className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 dark:bg-background/70"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={messages.adminLogin.passwordPlaceholder}
              type="password"
              value={password}
            />
          </label>
        </div>
      </div>
      <div className="rounded-[1.5rem] border border-dashed border-line bg-transparent px-4 py-3 text-sm leading-7 text-muted">
        <p>{messages.adminLogin.redirectNotice}</p>
        <p>{messages.adminLogin.securityHint}</p>
        <p className="font-medium text-foreground">{redirectTarget}</p>
      </div>
      {errorMessage ? <p className="text-sm text-warning">{errorMessage}</p> : null}
      <button className="button-primary w-full" disabled={pending} type="submit">
        {pending ? messages.adminLogin.pending : messages.adminLogin.submit}
      </button>
    </form>
  );
}