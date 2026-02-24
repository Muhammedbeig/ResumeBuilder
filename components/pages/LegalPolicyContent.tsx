"use client";

import { useSiteSettings } from "@/hooks/use-site-settings";
import { normalizeRichContent } from "@/lib/rich-content";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings-shared";

type PolicyField = "termsConditions" | "privacyPolicy" | "refundPolicy";

type LegalPolicyContentProps = {
  label: string;
  title: string;
  descriptionTemplate: string;
  policyField: PolicyField;
  emptyMessage: string;
};

export function LegalPolicyContent({
  label,
  title,
  descriptionTemplate,
  policyField,
  emptyMessage,
}: LegalPolicyContentProps) {
  const { settings, loaded } = useSiteSettings();
  const brandName = settings.companyName || DEFAULT_SITE_SETTINGS.companyName;
  const rawPolicy = settings[policyField];
  const content = normalizeRichContent(
    typeof rawPolicy === "string" ? rawPolicy : "",
  );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-4xl mx-auto px-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">
            {label}
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {descriptionTemplate.replace("{brandName}", brandName)}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {!loaded && !content ? (
            <div className="space-y-3">
              <div className="h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-10/12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ) : content ? (
            <div className="rich-content" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {emptyMessage}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
