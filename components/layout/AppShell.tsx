"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { Navigation } from "@/components/layout/Navigation";
import { SeoManager } from "@/components/layout/SeoManager";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings-shared";

export function AppShell({ children }: { children: ReactNode }) {
  const { settings, loaded } = useSiteSettings();
  const maintenanceMode = loaded && settings.maintenanceMode;
  const brandName = settings.companyName || DEFAULT_SITE_SETTINGS.companyName;
  const supportEmail = settings.companyEmail;
  const appLinks = [
    settings.appStoreLink ? { label: "App Store", href: settings.appStoreLink } : null,
    settings.playStoreLink ? { label: "Google Play", href: settings.playStoreLink } : null,
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <SeoManager />
      {maintenanceMode ? (
        <main className="min-h-screen flex items-center justify-center px-6 py-16">
          <div className="max-w-2xl w-full text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-600">
              Maintenance
            </p>
            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
              {brandName} is currently undergoing maintenance
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              We are applying updates and will be back shortly. Thank you for your patience.
            </p>
            {supportEmail ? (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Need help? Contact us at{" "}
                <a href={`mailto:${supportEmail}`} className="text-purple-600 hover:text-purple-500">
                  {supportEmail}
                </a>
                .
              </p>
            ) : null}
            {appLinks.length > 0 ? (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {appLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-600 dark:border-gray-700 dark:text-gray-300"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </main>
      ) : (
        <>
          <Navigation />
          {children}
          <Toaster
            position="top-right"
            richColors
            theme="light"
            toastOptions={{
              style: {
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
              },
            }}
          />
        </>
      )}
    </div>
  );
}
