import { ContactPage } from "@/components/pages/ContactPage";
import { Footer } from "@/sections/Footer";
import { fetchSiteSettings } from "@/lib/site-settings";

export default async function Contact() {
  const settings = await fetchSiteSettings();
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
