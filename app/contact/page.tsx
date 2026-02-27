"use client";

import { ContactPage } from "@/components/pages/ContactPage";
import { Footer } from "@/sections/Footer";
import { useSiteSettings } from "@/hooks/use-site-settings";

export default function Contact() {
  const { settings } = useSiteSettings();
  return (
    <>
      <ContactPage
        introHtml={settings.contactUs}
        companyEmail={settings.companyEmail}
        companyTel1={settings.companyTel1}
        companyTel2={settings.companyTel2}
        companyAddress={settings.companyAddress}
      />
      <div className="mt-20">
        <Footer />
      </div>
    </>
  );
}

