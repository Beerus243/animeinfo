"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";

export default function AdminLogoutButton() {
  const router = useRouter();
  const { messages } = useLanguage();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button className="button-secondary" disabled={pending} onClick={handleLogout} type="button">
      {pending ? messages.adminLogin.loggingOut : messages.adminLogin.logout}
    </button>
  );
}