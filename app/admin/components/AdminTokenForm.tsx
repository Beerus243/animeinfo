"use client";

import { useState, useSyncExternalStore } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

export default function AdminTokenForm() {
  const { messages } = useLanguage();
  const [draftToken, setDraftToken] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const storedToken = useSyncExternalStore(
    () => () => undefined,
    () => window.localStorage.getItem("animeinfo-admin-token") || "",
    () => "",
  );
  const token = draftToken ?? storedToken;

  function handleSave() {
    window.localStorage.setItem("animeinfo-admin-token", token);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="rounded-3xl border border-line bg-white/55 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{messages.token.label}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{messages.token.help}</p>
      <input
        className="mt-3 w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
        value={token}
        onChange={(event) => setDraftToken(event.target.value)}
        placeholder={messages.token.placeholder}
        type="password"
      />
      <button className="button-secondary mt-3 w-full" onClick={handleSave} type="button">
        {messages.token.save}
      </button>
      {saved ? <p className="mt-3 text-sm text-muted">{messages.token.saved}</p> : null}
    </div>
  );
}