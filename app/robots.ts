import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "https://resumibuilder.com";

const baseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, "");
};

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/editor",
          "/api",
          "/billing",
          "/checkout",
        ],
      },
    ],
    sitemap: `${baseUrl()}/sitemap.xml`,
  };
}
