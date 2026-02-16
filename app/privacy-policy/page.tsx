import { fetchSiteSettings } from "@/lib/site-settings";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings-shared";
import { normalizeRichContent } from "@/lib/rich-content";
import { Footer } from "@/sections/Footer";

export default async function PrivacyPolicyPage() {
  const settings = await fetchSiteSettings();
  const content = normalizeRichContent(settings.privacyPolicy);
  const brandName = settings.companyName || DEFAULT_SITE_SETTINGS.companyName;

  return (
    <>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
        <section className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">Privacy</p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              How {brandName} collects, uses, and protects your information.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {content ? (
              <div
                className="rich-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                The privacy policy is not available yet. Please check back later.
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
