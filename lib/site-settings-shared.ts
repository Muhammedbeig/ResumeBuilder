export type SiteSocialLinks = {
  facebook?: string;
  x?: string;
  instagram?: string;
  linkedin?: string;
  pinterest?: string;
};

export type WatermarkSettings = {
  enabled: boolean;
  opacity: number;
  size: number;
  rotation: number;
  style: string;
  position: string;
  imageUrl: string;
};

export type SiteSettings = {
  companyName: string;
  companyEmail: string;
  companyTel1: string;
  companyTel2: string;
  companyAddress: string;
  footerDescription: string;
  headerLogoUrl: string;
  footerLogoUrl: string;
  companyLogoUrl: string;
  faviconUrl: string;
  themeColor: string;
  maintenanceMode: boolean;
  appStoreLink: string;
  playStoreLink: string;
  bankTransferAdminEmail: string;
  social: SiteSocialLinks;
  termsConditions: string;
  privacyPolicy: string;
  refundPolicy: string;
  aboutUs: string;
  contactUs: string;
  watermark: WatermarkSettings;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  companyName: "ResuPro",
  companyEmail: "",
  companyTel1: "",
  companyTel2: "",
  companyAddress: "",
  footerDescription:
    "Build ATS-winning resumes with AI. Land your dream job faster with our intelligent resume builder.",
  headerLogoUrl: "",
  footerLogoUrl: "",
  companyLogoUrl: "",
  faviconUrl: "",
  themeColor: "",
  maintenanceMode: false,
  appStoreLink: "",
  playStoreLink: "",
  bankTransferAdminEmail: "",
  social: {},
  termsConditions: "",
  privacyPolicy: "",
  refundPolicy: "",
  aboutUs: "",
  contactUs: "",
  watermark: {
    enabled: false,
    opacity: 0.12,
    size: 48,
    rotation: -25,
    style: "single",
    position: "center",
    imageUrl: "",
  },
};
