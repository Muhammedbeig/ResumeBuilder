import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/sections/Footer";
import {
  careerBlogCategories,
  getCareerBlogCategory,
  getCareerBlogPostsByCategory,
} from "@/lib/career-blog-data";

export function generateStaticParams() {
  return careerBlogCategories.map((category) => ({ slug: category.slug }));
}

export default function CareerBlogCategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = getCareerBlogCategory(params.slug);

  if (!category) {
    notFound();
  }

  const posts = getCareerBlogPostsByCategory(category.slug);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Link href="/career-blog" className="text-sm font-semibold text-purple-600">
            Back to Career Blog
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-purple-600">
            {category.title}
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
            {category.description}
          </h1>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {category.highlights.map((highlight) => (
              <span key={highlight} className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/career-blog/${post.slug}`}
              className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {post.title}
                  </h2>
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

        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Explore every category
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Looking for a different topic? Browse the full library of career guidance.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {careerBlogCategories.map((item) => (
              <Link
                key={item.slug}
                href={`/career-blog/category/${item.slug}`}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                  item.slug === category.slug
                    ? "border-purple-400 text-purple-700 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 text-gray-700 hover:border-purple-300 dark:border-gray-800 dark:text-gray-200"
                }`}
              >
                {item.title}
              </Link>
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
