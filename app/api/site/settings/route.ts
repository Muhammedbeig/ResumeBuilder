import { json } from "@/lib/json";
import { fetchSiteSettings } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await fetchSiteSettings();
  return json({
    companyName: settings.companyName,
    companyEmail: settings.companyEmail,
    companyTel1: settings.companyTel1,
    companyTel2: settings.companyTel2,
    companyAddress: settings.companyAddress,
    footerDescription: settings.footerDescription,
    headerLogoUrl: settings.headerLogoUrl,
    footerLogoUrl: settings.footerLogoUrl,
    companyLogoUrl: settings.companyLogoUrl,
    faviconUrl: settings.faviconUrl,
    themeColor: settings.themeColor,
    maintenanceMode: settings.maintenanceMode,
    appStoreLink: settings.appStoreLink,
    playStoreLink: settings.playStoreLink,
    termsConditions: settings.termsConditions,
    privacyPolicy: settings.privacyPolicy,
    refundPolicy: settings.refundPolicy,
    aboutUs: settings.aboutUs,
    contactUs: settings.contactUs,
    watermark: settings.watermark,
    social: settings.social,
  });
}
