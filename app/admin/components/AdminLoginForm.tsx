"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useLanguage } from "@/app/components/LanguageProvider";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { messages } = useLanguage();
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

    const redirectTarget = searchParams.get("redirect") || "/admin";
    router.push(redirectTarget);
    router.refresh();
  }

  return (
    <form className="panel mx-auto max-w-lg space-y-5 px-6 py-8 md:px-8" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">{messages.adminLogin.eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl font-semibold">{messages.adminLogin.title}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">{messages.adminLogin.description}</p>
      </div>
      <input
        className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
        onChange={(event) => setEmail(event.target.value)}
        placeholder={messages.adminLogin.emailPlaceholder}
        type="email"
        value={email}
      />
      <input
        className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
        onChange={(event) => setPassword(event.target.value)}
        placeholder={messages.adminLogin.passwordPlaceholder}
        type="password"
        value={password}
      />
      {errorMessage ? <p className="text-sm text-warning">{errorMessage}</p> : null}
      <button className="button-primary w-full" disabled={pending} type="submit">
        {pending ? messages.adminLogin.pending : messages.adminLogin.submit}
      </button>
    </form>
  );
}