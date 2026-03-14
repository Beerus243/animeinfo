import { absoluteUrl } from "@/lib/seo";

type ReleaseAlertEmailInput = {
  to: string;
  animeTitles: string[];
  siteUrl?: string;
};

function getResendApiKey() {
  return process.env.RESEND_API_KEY || "";
}

function getResendFromEmail() {
  return process.env.RESEND_FROM_EMAIL || "";
}

export function isNotificationDeliveryConfigured() {
  return Boolean(getResendApiKey() && getResendFromEmail());
}

export async function sendReleaseAlertEmail(input: ReleaseAlertEmailInput) {
  if (!isNotificationDeliveryConfigured()) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL.");
  }

  const siteUrl = (input.siteUrl || process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1c160f">
      <h1 style="font-size:24px;margin-bottom:16px">Sorties anime a suivre</h1>
      <p>De nouvelles sorties approchent pour les anime que vous suivez :</p>
      <ul>
        ${input.animeTitles.map((title) => `<li>${title}</li>`).join("")}
      </ul>
      <p>
        Suivez les mises a jour sur <a href="${absoluteUrl("/airing")}">Manga Empire</a>.
      </p>
      <p style="font-size:12px;color:#6f6457">Email envoye depuis ${siteUrl}</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFromEmail(),
      to: [input.to],
      subject: `Nouvelles sorties anime: ${input.animeTitles.slice(0, 2).join(", ")}`,
      html,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || "Email delivery failed.");
  }

  return response.json();
}