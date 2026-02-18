import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROOT_DOMAIN = "resumibuilder.com";
const CANONICAL_DOMAIN = "www.resumibuilder.com";

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
  const host = resolveRequestHost(req);
  if (host !== ROOT_DOMAIN) return null;

  const url = req.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = CANONICAL_DOMAIN;
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
