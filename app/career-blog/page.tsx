import Link from "next/link";
import { Footer } from "@/sections/Footer";
import {
  careerBlogCategories,
  careerBlogPosts,
  featuredCareerBlogPosts,
} from "@/lib/career-blog-data";

const resourceLinks = [
  { name: "BLS Occupational Outlook Handbook", href: "https://www.bls.gov/ooh/" },
  { name: "O*NET Online Skills Database", href: "https://www.onetonline.org/" },
  { name: "CareerOneStop Career Explorer", href: "https://www.careeronestop.org/" },
  { name: "World Economic Forum Future of Jobs Report", href: "https://www.weforum.org/reports/the-future-of-jobs-report-2023/" },
  { name: "Pew Research Center Workforce and AI Report", href: "https://www.pewresearch.org/social-trends/2025/02/25/workers-views-of-ai-use-in-the-workplace/" },
];

export default function CareerBlogPage() {
  const featured =
    featuredCareerBlogPosts.length > 0 ? featuredCareerBlogPosts : careerBlogPosts.slice(0, 3);
  const categoryMap = Object.fromEntries(
    careerBlogCategories.map((category) => [category.slug, category.title])
  );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">Career Blog</p>
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

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {careerBlogCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/career-blog/category/${category.slug}`}
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-600">
                {category.title}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                {category.description}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                {category.highlights.map((highlight) => (
                  <span key={highlight} className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">
                    {highlight}
                  </span>
                ))}
              </div>
              <span className="mt-4 inline-flex text-sm font-semibold text-purple-600 group-hover:text-purple-700">
                Explore articles
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Featured guides</h2>
            <Link href="/career-blog" className="text-sm font-semibold text-purple-600 hover:text-purple-700">
              View all articles
            </Link>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((post) => (
              <Link
                key={post.slug}
                href={`/career-blog/${post.slug}`}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="rounded-full bg-purple-100 px-2 py-1 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {categoryMap[post.category] || "Article"}
                  </span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {post.title}
                </h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{post.excerpt}</p>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  {post.date} • {post.author.name}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">All articles</h2>
          <div className="mt-6 grid gap-4">
            {careerBlogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/career-blog/${post.slug}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-purple-600">
                      {categoryMap[post.category] || "Article"}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{post.excerpt}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{post.date}</span>
                      <span>{post.readTime}</span>
                      <span>{post.author.name}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-purple-600">Read guide</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trusted sources we follow</h3>
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
