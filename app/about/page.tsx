import Link from "next/link";
import { Footer } from "@/sections/Footer";
import { fetchSiteSettings } from "@/lib/site-settings";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings-shared";
import { normalizeRichContent } from "@/lib/rich-content";

const values = [
  {
    title: "Clarity over clutter",
    description:
      "We help job seekers tell a focused story with clean structure, strong verbs, and measurable outcomes.",
  },
  {
    title: "Proof over fluff",
    description:
      "Every suggestion aims to show impact, not just tasks. We push for evidence, metrics, and outcomes.",
  },
  {
    title: "Confidence through guidance",
    description:
      "Our tools give structure, examples, and prompts so you can move faster without losing your voice.",
  },
];

const resources = [
  { name: "BLS Occupational Outlook Handbook", href: "https://www.bls.gov/ooh/" },
  { name: "O*NET Online Skills Database", href: "https://www.onetonline.org/" },
  { name: "CareerOneStop Career Explorer", href: "https://www.careeronestop.org/" },
  { name: "World Economic Forum Future of Jobs Report", href: "https://www.weforum.org/reports/the-future-of-jobs-report-2023/" },
];

export default async function AboutPage() {
  const settings = await fetchSiteSettings();
  const brandName = settings.companyName || DEFAULT_SITE_SETTINGS.companyName;
  const aboutContent = normalizeRichContent(settings.aboutUs);
  const hasPanelContent = Boolean(aboutContent);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
            About {brandName}
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
            We help people present their best work with confidence
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {brandName} combines smart structure, expert guidance, and AI powered suggestions so every
            job seeker can build a polished resume, CV, or cover letter in minutes.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/resume/start"
              className="rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
            >
              Build a Resume
            </Link>
            <Link
              href="/career-blog"
              className="rounded-full border border-purple-200 px-5 py-2 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:border-purple-400 transition"
            >
              Read the Career Blog
            </Link>
          </div>
        </div>

        {hasPanelContent ? (
          <div className="mt-14 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: aboutContent }}
            />
          </div>
        ) : (
          <>
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">What we build</h2>
                <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Guided resume, CV, and cover letter editors with live previews.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Smart suggestions tailored to your experience and target role.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Professional templates designed for clarity and ATS readability.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">How we help</h2>
                <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Turn messy experience into clear, achievement focused bullets.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Suggest keywords and skills that align with your target job.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Provide checklists and examples to speed up editing.
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Trusted resources</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                We keep our guidance aligned with respected labor market and skills research so your
                resume strategy stays current.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {resources.map((resource) => (
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
          </>
        )}
      </section>
      <div className="mt-20">
        <Footer />
      </div>
    </main>
  );
}
