import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/sections/Footer";
import { panelGet } from "@/lib/panel-api";
import { resolvePanelAssetUrl } from "@/lib/panel-assets";

export const dynamic = "force-dynamic";

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

function slugifyCategory(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryMeta(post: PanelBlog): { label: string; slug: string } | null {
  const label = (post.category ?? "").trim();
  if (!label) return null;
  const rawSlug = (post.category_slug ?? "").trim();
  const slug = rawSlug || slugifyCategory(label);
  if (!slug) return null;
  return { label, slug };
}

export default async function CareerBlogTagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let tagValue = slug;
  try {
    tagValue = decodeURIComponent(slug);
  } catch {
    // ignore invalid escape sequences
  }

  const tagRes = await panelGet<BlogTag[]>("blog-tags");
  const tags = Array.isArray(tagRes.data) ? tagRes.data : [];
  const tag = tags.find((t) => t.value === tagValue);

  const blogsRes = await panelGet<PanelPaginator<PanelBlog>>("blogs", {
    tag: tagValue,
    sort_by: "new-to-old",
  });
  const posts = Array.isArray(blogsRes.data?.data) ? blogsRes.data.data : [];

  if (!tag && posts.length === 0) {
    notFound();
  }

  const title = tag?.label ?? tagValue;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Link href="/career-blog" className="text-sm font-semibold text-purple-600">
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
                    <span className="text-sm font-semibold text-purple-600">Read guide</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              No articles yet for this keyword. Add blogs with the tag "{tagValue}" in the Panel.
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
