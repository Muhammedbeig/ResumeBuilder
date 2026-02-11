import "server-only";

import { panelGet } from "@/lib/panel-api";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/site-settings-shared";

const CACHE_TTL_MS = 60_000;

let cached: SiteSettings | null = null;
let cachedAt = 0;

const asText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const asNumber = (value: unknown, fallback: number) => {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(num)) return num;
  return fallback;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const asToggle = (value: unknown): boolean | null => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  return null;
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  let data: Record<string, unknown> = {};
  try {
    const res = await panelGet<Record<string, unknown>>("get-system-settings");
    data = (res?.data ?? {}) as Record<string, unknown>;
  } catch {
    cached = DEFAULT_SITE_SETTINGS;
    cachedAt = now;
    return DEFAULT_SITE_SETTINGS;
  }

  const companyName = asText(data.company_name) || DEFAULT_SITE_SETTINGS.companyName;
  const footerDescription =
    asText(data.footer_description) || DEFAULT_SITE_SETTINGS.footerDescription;

  const headerLogoUrl = asText(data.header_logo) || asText(data.company_logo);
  const footerLogoUrl = asText(data.footer_logo) || asText(data.company_logo);
  const companyLogoUrl = asText(data.company_logo);
  const faviconUrl = asText(data.favicon_icon);

  const maintenanceMode =
    asToggle(data.maintenance_mode) ?? DEFAULT_SITE_SETTINGS.maintenanceMode;
  const appStoreLink = asText(data.app_store_link);
  const playStoreLink = asText(data.play_store_link);
  const bankTransferAdminEmail =
    asText(data.bank_transfer_admin_email) || asText(data.company_email);

  const watermarkEnabled =
    asToggle(data.watermark_enabled) ?? DEFAULT_SITE_SETTINGS.watermark.enabled;
  const watermarkOpacityRaw = asNumber(
    data.watermark_opacity,
    DEFAULT_SITE_SETTINGS.watermark.opacity * 100
  );
  const watermarkOpacity = clamp(watermarkOpacityRaw / 100, 0, 1);
  const watermarkSizeRaw = asNumber(
    data.watermark_size,
    DEFAULT_SITE_SETTINGS.watermark.size / 2.4
  );
  const watermarkSize = clamp(watermarkSizeRaw * 2.4, 12, 160);
  const watermarkRotation = asNumber(
    data.watermark_rotation,
    DEFAULT_SITE_SETTINGS.watermark.rotation
  );
  const watermarkStyle = asText(data.watermark_style) || DEFAULT_SITE_SETTINGS.watermark.style;
  const watermarkPosition =
    asText(data.watermark_position) || DEFAULT_SITE_SETTINGS.watermark.position;
  const watermarkImageUrl = asText(data.watermark_image);

  const settings: SiteSettings = {
    companyName,
    companyEmail: asText(data.company_email),
    companyTel1: asText(data.company_tel1),
    companyTel2: asText(data.company_tel2),
    companyAddress: asText(data.company_address),
    footerDescription,
    headerLogoUrl,
    footerLogoUrl,
    companyLogoUrl,
    faviconUrl,
    themeColor: asText(data.web_theme_color),
    maintenanceMode,
    appStoreLink,
    playStoreLink,
    bankTransferAdminEmail,
    social: {
      facebook: asText(data.facebook_link),
      x: asText(data.x_link),
      instagram: asText(data.instagram_link),
      linkedin: asText(data.linkedin_link),
      pinterest: asText(data.pinterest_link),
    },
    termsConditions: asText(data.terms_conditions),
    privacyPolicy: asText(data.privacy_policy),
    refundPolicy: asText(data.refund_policy),
    aboutUs: asText(data.about_us),
    contactUs: asText(data.contact_us),
    watermark: {
      enabled: watermarkEnabled,
      opacity: watermarkOpacity,
      size: watermarkSize,
      rotation: watermarkRotation,
      style: watermarkStyle,
      position: watermarkPosition,
      imageUrl: watermarkImageUrl,
    },
  };

  cached = settings;
  cachedAt = now;
  return settings;
}
