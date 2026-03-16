import { NextResponse, type NextRequest } from "next/server";

import { adminSessionCookieName, verifyAdminSession } from "@/lib/adminAuth";

const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

function buildCsp() {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ];

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://res.cloudinary.com",
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
    "https://*.mal-cdn.net",
    "https://*.myanimelist.net",
  ];

  const connectSrc = [
    "'self'",
    "https://api.cloudinary.com",
    "https://res.cloudinary.com",
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
    "https://analytics.google.com",
    "https://region1.google-analytics.com",
  ];

  const frameSrc = ["'self'"];

  if (adsenseClient && !adsenseClient.startsWith("ca-pub-XXXX")) {
    scriptSrc.push("https://pagead2.googlesyndication.com");
    imgSrc.push("https://pagead2.googlesyndication.com");
    frameSrc.push("https://googleads.g.doubleclick.net", "https://tpc.googlesyndication.com");
  }

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(" ")}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src ${imgSrc.join(" ")}`,
    `font-src 'self'`,
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
  ].join("; ");
}

function applySecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  response.headers.set("Content-Security-Policy", buildCsp());
  return response;
}

export async function proxy(request: NextRequest) {
  // Admin route protection
  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/login")) {
    const sessionValue = request.cookies.get(adminSessionCookieName)?.value;
    if (!(await verifyAdminSession(sessionValue))) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon|apple-icon|opengraph-image|push-sw\\.js|manifest\\.json|google[a-z0-9]+\\.html).*)",
  ],
};