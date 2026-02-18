import type { MetadataRoute } from "next";

const baseUrl = () => {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL;
  if (!raw) {
    throw new Error(
      "Missing NEXT_PUBLIC_SITE_URL (or NEXT_PUBLIC_APP_URL/NEXTAUTH_URL)",
    );
  }
  return raw.replace(/\/+$/, "");
};

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/editor", "/api", "/billing", "/checkout"],
      },
    ],
    sitemap: `${baseUrl()}/sitemap.xml`,
  };
}
