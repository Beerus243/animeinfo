import webpush, { type PushSubscription } from "web-push";

export type WebPushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
  icon?: string;
  badge?: string;
};

function getWebPushConfig() {
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "";
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY || "";
  const subject = process.env.WEB_PUSH_SUBJECT || "mailto:admin@animeinfo.local";

  return {
    publicKey,
    privateKey,
    subject,
  };
}

function configureWebPush() {
  const config = getWebPushConfig();
  if (!config.publicKey || !config.privateKey) {
    throw new Error("Missing WEB_PUSH_VAPID_PUBLIC_KEY or WEB_PUSH_VAPID_PRIVATE_KEY.");
  }

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return config;
}

export function isWebPushConfigured() {
  const config = getWebPushConfig();
  return Boolean(config.publicKey && config.privateKey);
}

export function getWebPushPublicKey() {
  return getWebPushConfig().publicKey;
}

export async function sendWebPushNotification(subscription: PushSubscription, payload: WebPushPayload) {
  configureWebPush();
  return webpush.sendNotification(subscription, JSON.stringify(payload));
}