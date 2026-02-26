"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resolveApiUrl } from "@/lib/client-api";
import { resolvePanelAssetUrl } from "@/lib/panel-assets";
import { normalizeRichContent } from "@/lib/rich-content";
import { useRuntimeRouteParam } from "@/lib/use-runtime-route-param";

type PanelPaginator<T> = {
  data: T[];
};

type PanelBlog = {
  id: number;
  slug: string;
  title?: string;
  translated_title?: string;
  description?: string;
  translated_description?: string;
  tags?: string[];
  translated_tags?: string[];
  category?: string | null;
  category_slug?: string | null;
  image?: string | null;
  created_at?: string;
};

type BlogsEnvelope = {
  error?: boolean;
  data?: PanelPaginator<PanelBlog>;
  other_blogs?: PanelBlog[];
};

function stripHtml(raw: string) {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptFromHtml(raw: string, maxLen = 180) {
  const text = stripHtml(raw);
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}...`;
}

function formatDate(iso: string | undefined) {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function slugifyCategory(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryMeta(
  post: PanelBlog,
): { label: string; slug: string } | null {
  const label = (post.category ?? "").trim();
  if (!label) return null;
  const rawSlug = (post.category_slug ?? "").trim();
  const slug = rawSlug || slugifyCategory(label);
  if (!slug) return null;
  return { label, slug };
}

async function fetchBlogBySlug(slug: string) {
  const url = new URL(resolveApiUrl("/api/blogs"), window.location.origin);
  url.searchParams.set("slug", slug);

  const response = await fetch(url.toString(), {
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) {
    return { blog: null, related: [] as PanelBlog[] };
  }

  const payload = (await response.json().catch(() => null)) as
    | BlogsEnvelope
    | null;
  if (!payload || payload.error) {
    return { blog: null, related: [] as PanelBlog[] };
  }

  const blog = Array.isArray(payload.data?.data) ? payload.data.data[0] : null;
  const related = Array.isArray(payload.other_blogs) ? payload.other_blogs : [];
  return { blog, related };
}

export default function BlogPostPageClient() {
  const slug = useRuntimeRouteParam("/career-blog");
  const [loading, setLoading] = useState(true);
  const [blog, setBlog] = useState<PanelBlog | null>(null);
  const [otherBlogs, setOtherBlogs] = useState<PanelBlog[]>([]);

  useEffect(() => {
    if (!slug || slug === "_") {
      setLoading(false);
      setBlog(null);
      setOtherBlogs([]);
      return;
    }

    let active = true;
    setLoading(true);

    void (async () => {
      try {
        const data = await fetchBlogBySlug(slug);
        if (!active) return;
        setBlog(data.blog);
        setOtherBlogs(data.related);
      } catch {
        if (!active) return;
        setBlog(null);
        setOtherBlogs([]);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  if (!slug || slug === "_") {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
        <section className="max-w-4xl mx-auto px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Open an article from the blog list to view full details.
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
        <section className="max-w-4xl mx-auto px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Loading article...
          </div>
        </section>
      </main>
    );
  }

  if (!blog) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
        <section className="max-w-4xl mx-auto px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Article not found.
          </div>
        </section>
      </main>
    );
  }

  const title = blog.translated_title ?? blog.title ?? "Untitled";
  const html = normalizeRichContent(
    blog.translated_description ?? blog.description ?? "",
  );
  const imageUrl = resolvePanelAssetUrl(blog.image);
  const category = getCategoryMeta(blog);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-4xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/career-blog" className="font-semibold text-purple-600">
            Back to Career Blog
          </Link>
        </div>

        <h1 className="mt-4 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          {excerptFromHtml(html)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {category ? (
            <Link
              href={`/career-blog/category/${encodeURIComponent(category.slug)}`}
              className="rounded-full bg-purple-100 px-2 py-1 font-semibold text-purple-700 transition hover:bg-purple-200 dark:bg-purple-500/20 dark:text-purple-200 dark:hover:bg-purple-500/30"
            >
              {category.label}
            </Link>
          ) : null}
          <span>{formatDate(blog.created_at)}</span>
        </div>

        {imageUrl ? (
          <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <img
              src={imageUrl}
              alt={title}
              className="w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

        <article className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div
            className="rich-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ready to apply these tips?
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Use ResuPro to turn your experience into a polished resume and cover
            letter in minutes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/resume/start"
              className="rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
            >
              Build a Resume
            </Link>
            <Link
              href="/cover-letter/start"
              className="rounded-full border border-purple-200 px-5 py-2 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:border-purple-400 transition"
            >
              Create a Cover Letter
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 mt-16">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Related guides
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {otherBlogs.length > 0 ? (
            otherBlogs.map((item) => (
              <Link
                key={item.slug}
                href={`/career-blog/${item.slug}`}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {item.translated_title ?? item.title ?? "Untitled"}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {excerptFromHtml(
                    item.translated_description ?? item.description ?? "",
                  )}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {(() => {
                    const relatedCategory = getCategoryMeta(item);
                    return relatedCategory ? (
                      <span className="rounded-full bg-purple-100 px-2 py-1 font-semibold text-purple-700 dark:bg-purple-500/20 dark:text-purple-200">
                        {relatedCategory.label}
                      </span>
                    ) : null;
                  })()}
                  {formatDate(item.created_at)}
                </div>
              </Link>
            ))
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              More guides coming soon.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
