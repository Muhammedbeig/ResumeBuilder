import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

type CanonicalTarget = {
  host: string;
  protocol: string;
};

const SITE_URL_ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_SITE_URL",
] as const;

function resolveCanonicalTargetFromEnv(): CanonicalTarget | null {
  for (const key of SITE_URL_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (!value) continue;
    try {
      const parsed = new URL(value);
      return {
        host: parsed.hostname.toLowerCase(),
        protocol: parsed.protocol || "https:",
      };
    } catch {
      continue;
    }
  }

  return null;
}

const CANONICAL_TARGET = resolveCanonicalTargetFromEnv();

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/resume",
  "/cv",
  "/cover-letter",
  "/ats-checker",
  "/ai-resume-optimizer",
  "/templates",
  "/choose-builder",
  "/editor",
  "/resume-preview",
  "/billing",
  "/career-management",
  "/reports",
];

const PUBLIC_PREFIXES = [
  "/about",
  "/career-blog",
  "/login",
  "/signup",
  "/api",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function resolveRequestHost(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const hostHeader =
    forwardedHost?.split(",")[0]?.trim() ||
    req.headers.get("host") ||
    req.nextUrl.host;
  return hostHeader.split(":")[0]?.toLowerCase() ?? "";
}

function redirectToCanonicalDomain(req: NextRequest): NextResponse | null {
  if (!CANONICAL_TARGET) return null;

  const host = resolveRequestHost(req);
  const canonicalHost = CANONICAL_TARGET.host;
  const rootHost = canonicalHost.startsWith("www.")
    ? canonicalHost.slice(4)
    : canonicalHost;

  if (canonicalHost === rootHost || host !== rootHost) return null;

  const url = req.nextUrl.clone();
  url.protocol = CANONICAL_TARGET.protocol;
  url.hostname = canonicalHost;
  // Prevent leaking upstream/internal ports (e.g. :3000) into public redirects.
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export async function proxy(req: NextRequest) {
  const canonicalRedirect = redirectToCanonicalDomain(req);
  if (canonicalRedirect) return canonicalRedirect;

  const { pathname, search } = req.nextUrl;

  if (pathname === "/") return NextResponse.next();
  if (
    PUBLIC_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
