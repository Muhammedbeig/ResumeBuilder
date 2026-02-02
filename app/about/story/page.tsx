import Link from "next/link";
import { Footer } from "@/sections/Footer";

const principles = [
  {
    title: "Clarity beats complexity",
    description: "Simple structure helps recruiters and ATS systems read your story quickly.",
  },
  {
    title: "Evidence drives trust",
    description: "We push for impact metrics and outcomes instead of vague responsibilities.",
  },
  {
    title: "Momentum matters",
    description: "Fast feedback and live previews keep people moving instead of stalling.",
  },
];

const chapters = [
  {
    title: "The problem we saw",
    description:
      "Great candidates were getting overlooked because their experience was buried under cluttered layouts or generic language.",
  },
  {
    title: "Our approach",
    description:
      "We combined expert resume structure with smart guidance so people could turn raw experience into a clear, confident story.",
  },
  {
    title: "Where we are headed",
    description:
      "We are building a career platform that stays helpful long after the resume is finished, from upskilling to promotion.",
  },
];

export default function AboutStoryPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Link href="/about" className="text-sm font-semibold text-purple-600">
            Back to About
          </Link>
          <p className="mt-3 text-sm font-semibold text-purple-600 uppercase tracking-widest">Our Story</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
            Built for people who want to tell their work with clarity
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            ResuPro started as a simple idea: if we can make it easier to explain impact, more people
            will land roles that match their skills.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {chapters.map((chapter) => (
            <div
              key={chapter.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{chapter.title}</h2>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{chapter.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Our principles</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {principles.map((principle) => (
              <div key={principle.title}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{principle.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{principle.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Our roadmap</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            We are focused on building a complete career toolkit. Here is what we are prioritizing next.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
              More personalized suggestions based on your exact role and industry.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
              Career growth plans that connect skills to future opportunities.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
              Guidance for interviews, negotiation, and long term growth.
            </li>
          </ul>
          <div className="mt-6">
            <Link
              href="/career-blog"
              className="rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
            >
              Explore the Career Blog
            </Link>
          </div>
        </div>
      </section>
      <div className="mt-20">
        <Footer />
      </div>
    </main>
  );
}
