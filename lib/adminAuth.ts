import { NextRequest } from "next/server";

export const adminSessionCookieName = "animeinfo-admin-session";

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function bytesToBase64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_TOKEN || "animeinfo-dev-session-secret";
}

async function signValue(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAdminSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "admin@animeinfo.local",
    password: process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || "",
  };
}

export function verifyAdminCredentials(email: string, password: string) {
  const credentials = getAdminCredentials();
  return email === credentials.email && password === credentials.password;
}

export async function createAdminSession(email: string) {
  const payload = {
    email,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminSession(sessionValue?: string | null) {
  if (!sessionValue) {
    return false;
  }

  const [encodedPayload, signature] = sessionValue.split(".");
  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = await signValue(encodedPayload);
  if (signature !== expectedSignature) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as { email?: string; exp?: number };
    if (!payload.email || !payload.exp || payload.exp < Date.now()) {
      return false;
    }

    return payload.email === getAdminCredentials().email;
  } catch {
    return false;
  }
}

export async function isAdminRequestAuthorized(request: NextRequest, options?: { allowQueryToken?: boolean }) {
  const sessionValue = request.cookies.get(adminSessionCookieName)?.value;
  if (await verifyAdminSession(sessionValue)) {
    return true;
  }

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return false;
  }

  const headerToken = request.headers.get("x-admin-token") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (headerToken === adminToken) {
    return true;
  }

  if (options?.allowQueryToken && request.nextUrl.searchParams.get("token") === adminToken) {
    return true;
  }

  return false;
}