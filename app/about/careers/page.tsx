import Link from "next/link";
import { Footer } from "@/sections/Footer";

const values = [
  {
    title: "User first mindset",
    description: "Every decision starts with what makes job seekers more confident and effective.",
  },
  {
    title: "Bias for clarity",
    description: "We document, communicate, and keep work moving with light weight processes.",
  },
  {
    title: "Growth through feedback",
    description: "We share feedback often and use it to improve quickly.",
  },
];

const benefits = [
  "Remote friendly collaboration",
  "Learning and development budget",
  "Flexible schedules and focus time",
  "Competitive compensation and equity",
];

const roles = [
  { title: "Product Designer", location: "Remote" },
  { title: "Full Stack Engineer", location: "Remote" },
  { title: "Content Strategist", location: "Hybrid" },
  { title: "Growth Marketing Lead", location: "Remote" },
];

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Link href="/about" className="text-sm font-semibold text-purple-600">
            Back to About
          </Link>
          <p className="mt-3 text-sm font-semibold text-purple-600 uppercase tracking-widest">Careers</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
            Help people tell their story with confidence
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Join a team that believes great careers start with clear storytelling. We are building
            tools that make job search feel faster, fairer, and more human.
          </p>
          <div className="mt-6">
            <Link
              href="/contact"
              className="rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
            >
              Join the talent network
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{value.title}</h2>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Benefits</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Hiring process</h2>
            <ol className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex gap-2">
                <span className="mt-1 h-5 w-5 rounded-full bg-purple-100 text-center text-xs font-semibold text-purple-700">
                  1
                </span>
                Intro call and role alignment.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-5 w-5 rounded-full bg-purple-100 text-center text-xs font-semibold text-purple-700">
                  2
                </span>
                Skills interview or portfolio review.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-5 w-5 rounded-full bg-purple-100 text-center text-xs font-semibold text-purple-700">
                  3
                </span>
                Team conversation and final decision.
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Roles we hire for</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <div
                key={role.title}
                className="rounded-xl border border-gray-200 px-4 py-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200"
              >
                <div className="font-semibold text-gray-900 dark:text-white">{role.title}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{role.location}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Interested? Share your resume with a short note about the role you want to grow into.
          </p>
        </div>
      </section>
      <div className="mt-20">
        <Footer />
      </div>
    </main>
  );
}
