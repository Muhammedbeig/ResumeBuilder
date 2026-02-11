import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Pin,
  Sparkles,
  Twitter,
} from "lucide-react";
import { fetchSiteSettings } from "@/lib/site-settings";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings-shared";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    // { name: "Pricing", href: "#pricing" },
    { name: "Templates", href: "/templates" },
    { name: "ATS Checker", href: "/ats-checker" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/about/careers" },
    { name: "Blog", href: "/career-blog" },
    { name: "Press", href: "/about/press" },
    { name: "Contact", href: "/contact" },
  ],
  resources: [
    { name: "Help Center", href: "/#faq" },
    { name: "Resume Examples", href: "/templates" },
    // Panel blog uses tags (keywords). Keep this link generic to avoid implying categories.
    { name: "Career Blog", href: "/career-blog" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/terms-of-service" },
    { name: "Refund Policy", href: "/refund-policy" },
  ],
};

type SocialLink = { name: string; icon: typeof Twitter; href: string };

export async function Footer() {
  const settings = await fetchSiteSettings();
  const brandName = settings.companyName || DEFAULT_SITE_SETTINGS.companyName;
  const description = settings.footerDescription || DEFAULT_SITE_SETTINGS.footerDescription;
  const footerLogo = settings.footerLogoUrl || settings.companyLogoUrl;
  const socialLinks: SocialLink[] = [
    settings.social.x ? { name: "X", icon: Twitter, href: settings.social.x } : null,
    settings.social.facebook
      ? { name: "Facebook", icon: Facebook, href: settings.social.facebook }
      : null,
    settings.social.instagram
      ? { name: "Instagram", icon: Instagram, href: settings.social.instagram }
      : null,
    settings.social.linkedin
      ? { name: "LinkedIn", icon: Linkedin, href: settings.social.linkedin }
      : null,
    settings.social.pinterest
      ? { name: "Pinterest", icon: Pin, href: settings.social.pinterest }
      : null,
    settings.companyEmail
      ? { name: "Email", icon: Mail, href: `mailto:${settings.companyEmail}` }
      : null,
  ].filter(Boolean) as SocialLink[];
  const appLinks = [
    settings.appStoreLink ? { name: "App Store", href: settings.appStoreLink } : null,
    settings.playStoreLink ? { name: "Google Play", href: settings.playStoreLink } : null,
  ].filter(Boolean) as Array<{ name: string; href: string }>;

  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {footerLogo ? (
                <img
                  src={footerLogo}
                  alt={`${brandName} logo`}
                  className="h-7 w-auto object-contain"
                />
              ) : (
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              )}
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {brandName}
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xs">
              {description}
            </p>
            {settings.companyAddress ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                {settings.companyAddress}
              </p>
            ) : null}

            {/* Social Links */}
            {socialLinks.length > 0 ? (
              <div className="flex items-center gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      aria-label={social.name}
                      target={social.href.startsWith("http") ? "_blank" : undefined}
                      rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            ) : null}

            {appLinks.length > 0 ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Get the App
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {appLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-600 dark:border-gray-700 dark:text-gray-300"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            (c) {year} {brandName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-500">
              Made with love for job seekers worldwide
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
