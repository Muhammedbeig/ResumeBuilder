import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/sections/Footer";
import { panelGet } from "@/lib/panel-api";
import { resolvePanelAssetUrl } from "@/lib/panel-assets";

export const dynamic = "force-dynamic";

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

function stripHtml(raw: string) {
  return raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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

export default async function CareerBlogCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let categorySlug = slug;
  try {
    categorySlug = decodeURIComponent(slug);
  } catch {
    // ignore invalid escape sequences
  }

  const [categoryRes, blogsRes] = await Promise.allSettled([
    panelGet<BlogCategory[]>("blog-categories"),
    panelGet<PanelPaginator<PanelBlog>>("blogs", {
      category_slug: categorySlug,
      sort_by: "new-to-old",
    }),
  ]);

  const categories =
    categoryRes.status === "fulfilled" && Array.isArray(categoryRes.value.data)
      ? categoryRes.value.data
      : [];
  const posts =
    blogsRes.status === "fulfilled" && Array.isArray(blogsRes.value.data?.data)
      ? blogsRes.value.data.data
      : [];

  const category = categories.find((item) => item.value === categorySlug);
  if (!category && posts.length === 0) {
    notFound();
  }

  const title = category?.label ?? posts[0]?.category ?? humanizeSlug(categorySlug);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Link href="/career-blog" className="text-sm font-semibold text-purple-600">
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
                        {excerptFromHtml(post.translated_description ?? post.description ?? "")}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-purple-600">Read guide</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              No articles yet for this category. Add categories while creating blogs in the Panel.
            </div>
          )}
        </div>
      </section>

      <div className="mt-20">
        <Footer />
      </div>
    </main>
  );
}
