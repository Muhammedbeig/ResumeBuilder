import Link from "next/link";
import { Footer } from "@/sections/Footer";
import { panelGet } from "@/lib/panel-api";
import { resolvePanelAssetUrl } from "@/lib/panel-assets";

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
  image?: string | null;
  tags?: string[];
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

const resourceLinks = [
  { name: "BLS Occupational Outlook Handbook", href: "https://www.bls.gov/ooh/" },
  { name: "O*NET Online Skills Database", href: "https://www.onetonline.org/" },
  { name: "CareerOneStop Career Explorer", href: "https://www.careeronestop.org/" },
  {
    name: "World Economic Forum Future of Jobs Report",
    href: "https://www.weforum.org/reports/the-future-of-jobs-report-2023/",
  },
  {
    name: "Pew Research Center Workforce and AI Report",
    href: "https://www.pewresearch.org/social-trends/2025/02/25/workers-views-of-ai-use-in-the-workplace/",
  },
];

export default async function CareerBlogPage() {
  let blogs: PanelBlog[] = [];

  try {
    const blogsRes = await panelGet<PanelPaginator<PanelBlog>>("blogs", { sort_by: "new-to-old" });
    blogs = Array.isArray(blogsRes.data?.data) ? blogsRes.data.data : [];
  } catch {
    blogs = [];
  }

  const featured = blogs.slice(0, 3);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
            Career Blog
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
            Practical guidance for every career stage
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Explore actionable playbooks, proven frameworks, and real world career advice written for
            modern job seekers.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
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

        <div className="mt-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Latest guides</h2>
            <Link
              href="/career-blog"
              className="text-sm font-semibold text-purple-600 hover:text-purple-700"
            >
              View all articles
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((post) => (
                <Link
                  key={post.slug}
                  href={`/career-blog/${post.slug}`}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
                >
                  {(() => {
                    const imageUrl = resolvePanelAssetUrl(post.image);
                    const title = post.translated_title ?? post.title ?? "Untitled";
                    return imageUrl ? (
                      <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                        <img
                          src={imageUrl}
                          alt={title}
                          className="h-40 w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : null;
                  })()}
                  <div className="flex items-center justify-end text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                    {post.translated_title ?? post.title ?? "Untitled"}
                  </h3>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    {excerptFromHtml(post.translated_description ?? post.description ?? "")}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              No articles yet. Add blogs in the Panel to populate this page.
            </div>
          )}
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">All articles</h2>
          <div className="mt-6 grid gap-4">
            {blogs.map((post) => (
              <Link
                key={post.slug}
                href={`/career-blog/${post.slug}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {(() => {
                    const imageUrl = resolvePanelAssetUrl(post.image);
                    const title = post.translated_title ?? post.title ?? "Untitled";
                    return imageUrl ? (
                      <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 sm:w-44">
                        <img
                          src={imageUrl}
                          alt={title}
                          className="h-28 w-full object-cover sm:h-28"
                          loading="lazy"
                        />
                      </div>
                    ) : null;
                  })()}
                  <div>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                      {post.translated_title ?? post.title ?? "Untitled"}
                    </h3>
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
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trusted sources we follow
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            We keep our guidance aligned with reliable labor market and workforce research so you can
            make informed decisions.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {resourceLinks.map((resource) => (
              <a
                key={resource.name}
                href={resource.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-600 dark:border-gray-800 dark:text-gray-200"
              >
                {resource.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-20">
        <Footer />
      </div>
    </main>
  );
}
