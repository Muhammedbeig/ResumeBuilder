import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/sections/Footer";
import { panelGet } from "@/lib/panel-api";
import { resolvePanelAssetUrl } from "@/lib/panel-assets";
import { normalizeRichContent } from "@/lib/rich-content";

export const dynamic = "force-dynamic";

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

function stripHtml(raw: string) {
  return raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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

function getCategoryMeta(post: PanelBlog): { label: string; slug: string } | null {
  const label = (post.category ?? "").trim();
  if (!label) return null;
  const rawSlug = (post.category_slug ?? "").trim();
  const slug = rawSlug || slugifyCategory(label);
  if (!slug) return null;
  return { label, slug };
}

export default async function CareerBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const res = await panelGet<PanelPaginator<PanelBlog>>("blogs", { slug });
  const page = res.data;
  const blog = page?.data?.[0];
  if (!blog) {
    notFound();
  }

  const otherBlogs = ((res as unknown as { other_blogs?: PanelBlog[] }).other_blogs ??
    []) as PanelBlog[];

  const title = blog.translated_title ?? blog.title ?? "Untitled";
  const html = normalizeRichContent(blog.translated_description ?? blog.description ?? "");
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
        <p className="mt-4 text-gray-600 dark:text-gray-300">{excerptFromHtml(html)}</p>
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
            <img src={imageUrl} alt={title} className="w-full object-cover" loading="lazy" />
          </div>
        ) : null}

        <article className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="rich-content" dangerouslySetInnerHTML={{ __html: html }} />
        </article>

        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ready to apply these tips?
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Use ResuPro to turn your experience into a polished resume and cover letter in minutes.
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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Related guides</h2>
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
                  {excerptFromHtml(item.translated_description ?? item.description ?? "")}
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
            <div className="text-sm text-gray-600 dark:text-gray-300">More guides coming soon.</div>
          )}
        </div>
      </section>

      <div className="mt-20">
        <Footer />
      </div>
    </main>
  );
}
