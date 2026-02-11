import Link from "next/link";
import { Footer } from "@/sections/Footer";

const brandGuidelines = [
  "Use the name ResuPro with capital R and P.",
  "Keep logos clear with generous padding.",
  "Do not stretch, rotate, or recolor the logo.",
  "Use our primary colors for digital badges and highlights.",
];

const quickFacts = [
  "AI assisted resume, CV, and cover letter builder.",
  "Designed for ATS friendly structure and human readability.",
  "Guided suggestions tailored to role and experience level.",
];

export default function PressPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Link href="/about" className="text-sm font-semibold text-purple-600">
            Back to About
          </Link>
          <p className="mt-3 text-sm font-semibold text-purple-600 uppercase tracking-widest">Press</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
            Press kit and media resources
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Find quick facts, brand guidelines, and contact details for press inquiries.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Company boilerplate</h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              ResuPro is an AI assisted resume builder that helps job seekers create polished, ATS
              ready resumes, CVs, and cover letters. Our guided editor and expert prompts make it
              easy to translate experience into clear, achievement focused content.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick facts</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              {quickFacts.map((fact) => (
                <li key={fact} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Brand guidelines</h2>
          <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            {brandGuidelines.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Need a logo pack or product screenshots? Contact our press team and we will share assets.
          </p>
        </div>

        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Press contact</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            For media inquiries, interviews, or brand assets, use the contact page.
          </p>
          <Link href="/contact" className="mt-4 inline-flex text-sm font-semibold text-purple-600 hover:text-purple-500">
            Contact the team
          </Link>
        </div>
      </section>
      <div className="mt-20">
        <Footer />
      </div>
    </main>
  );
}
