import type { MetadataRoute } from "next";
import { panelGet } from "@/lib/panel-api";

const DEFAULT_SITE_URL = "https://resumibuilder.com";

type PanelBlog = {
  slug?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type BlogCategory = {
  value?: string | null;
};

type PanelPagination<T> = {
  data?: T[];
  current_page?: number;
  last_page?: number;
};

type PanelResponse<T> = {
  data?: PanelPagination<T> | T[];
};

const toBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, "");
};

const buildUrl = (path: string) => {
  const base = toBaseUrl();
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
};

const normalizeCustomUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("#")) return null;
  if (trimmed.startsWith("/")) return buildUrl(trimmed);
  return buildUrl(`/${trimmed}`);
};

async function fetchCustomLinks(): Promise<string[]> {
  try {
    const res = await panelGet<Record<string, unknown>>("get-system-settings");
    const raw = typeof res?.data?.sitemap_custom_links === "string"
      ? res.data.sitemap_custom_links
      : "";
    const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const urls = lines.map(normalizeCustomUrl).filter(Boolean) as string[];
    return Array.from(new Set(urls));
  } catch {
    return [];
  }
}

async function fetchAllBlogs(): Promise<PanelBlog[]> {
  const posts: PanelBlog[] = [];
  let page = 1;
  let lastPage = 1;

  while (page <= lastPage) {
    try {
      const res = await panelGet<PanelResponse<PanelBlog>>("blogs", {
        sort_by: "new-to-old",
        page,
      });
      const payload = res?.data;
      const pageData = Array.isArray((payload as PanelPagination<PanelBlog>)?.data)
        ? ((payload as PanelPagination<PanelBlog>).data as PanelBlog[])
        : Array.isArray(payload)
        ? (payload as PanelBlog[])
        : [];
      posts.push(...pageData);
      const meta = payload as PanelPagination<PanelBlog>;
      lastPage = Number(meta?.last_page ?? meta?.current_page ?? lastPage) || lastPage;
      page += 1;
    } catch {
      break;
    }
  }

  return posts;
}

async function fetchBlogCategories(): Promise<BlogCategory[]> {
  try {
    const res = await panelGet<BlogCategory[]>("blog-categories");
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths = [
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
    "/about/story",
    "/about/press",
    "/about/careers",
    "/contact",
    "/privacy-policy",
    "/terms-of-service",
    "/refund-policy",
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path, index) => ({
    url: buildUrl(path),
    lastModified: now,
    changeFrequency: index === 0 ? "daily" : "weekly",
    priority: index === 0 ? 1 : 0.7,
  }));

  const [customLinks, blogs, categories] = await Promise.all([
    fetchCustomLinks(),
    fetchAllBlogs(),
    fetchBlogCategories(),
  ]);

  for (const link of customLinks) {
    entries.push({
      url: link,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  for (const blog of blogs) {
    if (!blog?.slug) continue;
    const lastModified = blog.updated_at || blog.created_at || now;
    entries.push({
      url: buildUrl(`/career-blog/${blog.slug}`),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const category of categories) {
    if (!category?.value) continue;
    entries.push({
      url: buildUrl(`/career-blog/category/${encodeURIComponent(category.value)}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return entries;
}
