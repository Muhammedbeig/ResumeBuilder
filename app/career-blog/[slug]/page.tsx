import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/sections/Footer";
import {
  careerBlogCategories,
  careerBlogPosts,
  getCareerBlogPost,
} from "@/lib/career-blog-data";

export function generateStaticParams() {
  return careerBlogPosts.map((post) => ({ slug: post.slug }));
}

export default function CareerBlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getCareerBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  const category = careerBlogCategories.find((item) => item.slug === post.category);
  const relatedPosts = careerBlogPosts
    .filter((item) => item.category === post.category && item.slug !== post.slug)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-4xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/career-blog" className="font-semibold text-purple-600">
            Back to Career Blog
          </Link>
          {category ? (
            <Link
              href={`/career-blog/category/${category.slug}`}
              className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            >
              {category.title}
            </Link>
          ) : null}
        </div>

        <h1 className="mt-4 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
          {post.title}
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">{post.excerpt}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{post.date}</span>
          <span>{post.readTime}</span>
          <span>{post.author.name}</span>
          <span>{post.author.role}</span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Key takeaways</h2>
          <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
            {post.takeaways.map((takeaway) => (
              <li key={takeaway} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 space-y-10">
          {post.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

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
          {relatedPosts.length > 0 ? (
            relatedPosts.map((item) => (
              <Link
                key={item.slug}
                href={`/career-blog/${item.slug}`}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.excerpt}</p>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  {item.date} • {item.readTime}
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

      <div className="mt-20">
        <Footer />
      </div>
    </main>
  );
}
