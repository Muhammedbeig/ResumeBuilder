import type { MetadataRoute } from "next";

const baseUrl = () => {
  const candidates = [
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

  return null;
};

export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/editor", "/api", "/billing", "/checkout"],
      },
    ],
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
