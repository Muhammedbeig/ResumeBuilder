"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resolveApiUrl } from "@/lib/client-api";
import { resolvePanelAssetUrl } from "@/lib/panel-assets";
import { useRuntimeRouteParam } from "@/lib/use-runtime-route-param";

type BlogTag = { label: string; value: string };

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
  tags?: string[];
  category?: string | null;
  category_slug?: string | null;
  created_at?: string;
};

type TagEnvelope = {
  error?: boolean;
  data?: BlogTag[];
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

async function fetchTagData(tagValue: string) {
  const tagsUrl = new URL(resolveApiUrl("/api/blog-tags"), window.location.origin);
  const blogsUrl = new URL(resolveApiUrl("/api/blogs"), window.location.origin);
  blogsUrl.searchParams.set("tag", tagValue);
  blogsUrl.searchParams.set("sort_by", "new-to-old");

  const [tagsRes, blogsRes] = await Promise.allSettled([
    fetch(tagsUrl.toString(), {
      cache: "no-store",
      credentials: "include",
    }),
    fetch(blogsUrl.toString(), {
      cache: "no-store",
      credentials: "include",
    }),
  ]);

  const tags =
    tagsRes.status === "fulfilled" && tagsRes.value.ok
      ? ((((await tagsRes.value.json().catch(() => null)) as
          | TagEnvelope
          | null)?.data ?? []) as BlogTag[])
      : [];

  const posts =
    blogsRes.status === "fulfilled" && blogsRes.value.ok
      ? ((((await blogsRes.value.json().catch(() => null)) as
          | BlogsEnvelope
          | null)?.data?.data ?? []) as PanelBlog[])
      : [];

  return { tags, posts };
}

export default function TagPageClient() {
  const slug = useRuntimeRouteParam("/career-blog/tag");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PanelBlog[]>([]);
  const [tagLabel, setTagLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || slug === "_") {
      setLoading(false);
      setPosts([]);
      setTagLabel(null);
      return;
    }

    let active = true;
    setLoading(true);

    void (async () => {
      try {
        const { tags, posts: nextPosts } = await fetchTagData(slug);
        if (!active) return;
        const matched = tags.find((item) => item.value === slug);
        setTagLabel(matched?.label ?? slug);
        setPosts(nextPosts);
      } catch {
        if (!active) return;
        setTagLabel(null);
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
            Select a keyword tag from the blog page to view tagged posts.
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
            Loading keyword results...
          </div>
        </section>
      </main>
    );
  }

  if (!tagLabel && posts.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
        <section className="max-w-6xl mx-auto px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            Keyword not found.
          </div>
        </section>
      </main>
    );
  }

  const title = tagLabel ?? slug;

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
            Keyword
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            Updated directly from the Admin Panel.
          </p>
        </div>

        <div className="mt-12 grid gap-5">
          {posts.length > 0 ? (
            posts.map((post) => {
              const imageUrl = resolvePanelAssetUrl(post.image);
              const postTitle = post.translated_title ?? post.title ?? "Untitled";
              return (
                <article
                  key={post.slug}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {imageUrl ? (
                      <Link
                        href={`/career-blog/${post.slug}`}
                        className="block w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 sm:w-44"
                      >
                        <img
                          src={imageUrl}
                          alt={postTitle}
                          className="h-28 w-full object-cover sm:h-28"
                          loading="lazy"
                        />
                      </Link>
                    ) : null}
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        <Link
                          href={`/career-blog/${post.slug}`}
                          className="hover:text-purple-600 dark:hover:text-purple-300 transition"
                        >
                          {postTitle}
                        </Link>
                      </h2>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {excerptFromHtml(
                          post.translated_description ?? post.description ?? "",
                        )}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {(() => {
                          const category = getCategoryMeta(post);
                          return category ? (
                            <Link
                              href={`/career-blog/category/${encodeURIComponent(category.slug)}`}
                              className="rounded-full bg-purple-100 px-2 py-1 font-semibold text-purple-700 transition hover:bg-purple-200 dark:bg-purple-500/20 dark:text-purple-200 dark:hover:bg-purple-500/30"
                            >
                              {category.label}
                            </Link>
                          ) : null;
                        })()}
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                    <Link
                      href={`/career-blog/${post.slug}`}
                      className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                    >
                      Read guide
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              No articles yet for this keyword. Add blogs with this tag in the
              Panel.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
