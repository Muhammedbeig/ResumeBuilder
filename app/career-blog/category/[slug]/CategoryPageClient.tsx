"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resolveApiUrl } from "@/lib/client-api";
import { resolvePanelAssetUrl } from "@/lib/panel-assets";
import { useRuntimeRouteParam } from "@/lib/use-runtime-route-param";

type BlogCategory = { label: string; value: string };

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
  image?: string | null;
  category?: string | null;
  category_slug?: string | null;
  created_at?: string;
};

type CategoryEnvelope = {
  error?: boolean;
  data?: BlogCategory[];
};

type BlogsEnvelope = {
  error?: boolean;
  data?: PanelPaginator<PanelBlog>;
};

function stripHtml(raw: string) {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptFromHtml(raw: string, maxLen = 160) {
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

function humanizeSlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function fetchCategoryData(categorySlug: string) {
  const categoriesUrl = new URL(
    resolveApiUrl("/rb/blog-categories"),
    window.location.origin,
  );
  const blogsUrl = new URL(resolveApiUrl("/rb/blogs"), window.location.origin);
  blogsUrl.searchParams.set("category_slug", categorySlug);
  blogsUrl.searchParams.set("sort_by", "new-to-old");

  const [categoryRes, blogsRes] = await Promise.allSettled([
    fetch(categoriesUrl.toString(), {
      cache: "no-store",
      credentials: "include",
    }),
    fetch(blogsUrl.toString(), {
      cache: "no-store",
      credentials: "include",
    }),
  ]);

  const categories =
    categoryRes.status === "fulfilled" && categoryRes.value.ok
      ? ((((await categoryRes.value.json().catch(() => null)) as
          | CategoryEnvelope
          | null)?.data ?? []) as BlogCategory[])
      : [];

  const posts =
    blogsRes.status === "fulfilled" && blogsRes.value.ok
      ? ((((await blogsRes.value.json().catch(() => null)) as
          | BlogsEnvelope
          | null)?.data?.data ?? []) as PanelBlog[])
      : [];

  return { categories, posts };
}

export default function CategoryPageClient() {
  const slug = useRuntimeRouteParam("/career-blog/category");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PanelBlog[]>([]);
  const [categoryLabel, setCategoryLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || slug === "_") {
      setLoading(false);
      setPosts([]);
      setCategoryLabel(null);
      return;
    }

    let active = true;
    setLoading(true);

    void (async () => {
      try {
        const { categories, posts: nextPosts } = await fetchCategoryData(slug);
        if (!active) return;
        const matched = categories.find((item) => item.value === slug);
        setCategoryLabel(
          matched?.label ?? nextPosts[0]?.category ?? humanizeSlug(slug),
        );
        setPosts(nextPosts);
      } catch {
        if (!active) return;
        setCategoryLabel(null);
        setPosts([]);
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
        <section className="max-w-6xl mx-auto px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Select a category from the blog page to view category posts.
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
        <section className="max-w-6xl mx-auto px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Loading category guides...
          </div>
        </section>
      </main>
    );
  }

  if (!categoryLabel && posts.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
        <section className="max-w-6xl mx-auto px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Category not found.
          </div>
        </section>
      </main>
    );
  }

  const title = categoryLabel ?? humanizeSlug(slug);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Link
            href="/career-blog"
            className="text-sm font-semibold text-purple-600"
          >
            Back to Career Blog
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-purple-600">
            Category
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            Explore curated posts from this category.
          </p>
        </div>

        <div className="mt-12 grid gap-5">
          {posts.length > 0 ? (
            posts.map((post) => {
              const imageUrl = resolvePanelAssetUrl(post.image);
              const postTitle = post.translated_title ?? post.title ?? "Untitled";
              return (
                <Link
                  key={post.slug}
                  href={`/career-blog/${post.slug}`}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {imageUrl ? (
                      <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 sm:w-44">
                        <img
                          src={imageUrl}
                          alt={postTitle}
                          className="h-28 w-full object-cover sm:h-28"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {postTitle}
                      </h2>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {excerptFromHtml(
                          post.translated_description ?? post.description ?? "",
                        )}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-purple-600">
                      Read guide
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              No articles yet for this category. Add categories while creating
              blogs in the Panel.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
