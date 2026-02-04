"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { resolveSeo } from "@/lib/seo";

const setMetaTag = (selector: string, attrs: Record<string, string>) => {
  let element = document.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === "content") return;
      element?.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }
  if (attrs.content) {
    element.setAttribute("content", attrs.content);
  }
};

const setLinkTag = (rel: string, href: string) => {
  let element = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
};

export function SeoManager() {
  const pathname = usePathname();

  useEffect(() => {
    const seo = resolveSeo(pathname || "/");
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const canonical = baseUrl ? `${baseUrl}${pathname || "/"}` : "";

    document.title = seo.title;

    setMetaTag('meta[name="description"]', { name: "description", content: seo.description });
    if (seo.keywords?.length) {
      setMetaTag('meta[name="keywords"]', {
        name: "keywords",
        content: seo.keywords.join(", "),
      });
    }
    setMetaTag('meta[name="robots"]', {
      name: "robots",
      content: seo.noindex ? "noindex, nofollow" : "index, follow",
    });

    setMetaTag('meta[property="og:title"]', { property: "og:title", content: seo.title });
    setMetaTag('meta[property="og:description"]', {
      property: "og:description",
      content: seo.description,
    });
    setMetaTag('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: seo.title,
    });
    setMetaTag('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: seo.description,
    });

    if (canonical) {
      setLinkTag("canonical", canonical);
      setMetaTag('meta[property="og:url"]', { property: "og:url", content: canonical });
    }
  }, [pathname]);

  return null;
}
