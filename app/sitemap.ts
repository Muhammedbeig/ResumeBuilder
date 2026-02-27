import type { MetadataRoute } from "next";

export const dynamic = "force-static";

function toBaseUrl() {
  const candidates = [
    process.env.WEBSITE_URL,
    process.env.NEXT_PUBLIC_WEBSITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
  ];

  for (const candidate of candidates) {
    const raw = candidate?.trim();
    if (!raw) continue;
    try {
      const parsed = new URL(raw);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      continue;
    }
  }

  return "";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = toBaseUrl();
  if (!base) return [];

  const now = new Date();
  const paths = [
    "/",
    "/pricing",
    "/choose-builder",
    "/templates",
    "/ats-checker",
    "/ai-resume-optimizer",
    "/career-management",
    "/career-blog",
    "/resume/start",
    "/cv/start",
    "/cover-letter/start",
    "/cover-letter/templates",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms-of-service",
    "/refund-policy",
  ];

  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
