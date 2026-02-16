import type { ResumeTemplateCatalogEntry } from "@/lib/resume-template-catalog";
import { RESUME_TEMPLATE_CATALOG_MAP } from "@/lib/resume-template-catalog";

export type TemplateType = "resume" | "cv" | "cover_letter";

export type PanelTemplateCategory = {
  id: number;
  type: TemplateType;
  slug: string;
  label: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export type PanelTemplate = {
  template_id: string;
  type: TemplateType;
  name: string;
  description?: string | null;
  category?: { slug: string; label: string } | null;
  is_premium: boolean;
  is_active: boolean;
  is_generated?: boolean;
  sort_order?: number;
  preview_image?: string | null;
  render_engine: string;
  config?: Record<string, unknown> | null;
};

export type ResumeTemplateConfig = ResumeTemplateCatalogEntry;

export type CvTemplateConfig = {
  layout?: "single" | "two-column";
  sidebarPosition?: "left" | "right";
  headerStyle?: "left" | "center";
  sectionStyle?: "caps" | "underline" | "pill" | "stripe";
  bulletStyle?: "dot" | "dash" | "diamond" | "line";
  ornament?: "orbs" | "grid" | "stripes" | "corner" | "badge" | "none";
  hasPhoto?: boolean;
  bodyFont?: string;
  headingFont?: string;
  palette?: {
    text?: string;
    muted?: string;
    surface?: string;
    border?: string;
  };
  background?: {
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
  };
};

export type CoverLetterTemplateConfig = {
  layout?: "classic" | "modern" | "split";
  headerStyle?: "left" | "center";
  accentColor?: string;
  bodyFont?: string;
  headingFont?: string;
  sectionSeparator?: "none" | "line" | "bar";
};

const DEFAULT_RESUME_CONFIG: ResumeTemplateCatalogEntry = {
  id: "custom",
  name: "Custom Template",
  category: "custom",
  description: "",
  bodyFont: "Inter",
  headingFont: "Inter",
  layout: "sidebar-left",
  headerStyle: "center",
  sectionStyle: "caps",
  bulletStyle: "dot",
  ornament: "none",
  hasPhoto: false,
  palette: {
    text: "#0f172a",
    muted: "#475569",
    surface: "rgba(255,255,255,0.8)",
    border: "rgba(148,163,184,0.3)",
  },
  background: {
    backgroundColor: "#ffffff",
  },
};

const DEFAULT_CV_CONFIG: Required<CvTemplateConfig> = {
  layout: "single",
  sidebarPosition: "left",
  headerStyle: "left",
  sectionStyle: "caps",
  bulletStyle: "dot",
  ornament: "none",
  hasPhoto: false,
  bodyFont: "Inter",
  headingFont: "Inter",
  palette: {
    text: "#0f172a",
    muted: "#475569",
    surface: "rgba(255,255,255,0.8)",
    border: "rgba(148,163,184,0.3)",
  },
  background: {
    backgroundColor: "#ffffff",
    backgroundImage: "",
    backgroundSize: "",
    backgroundPosition: "",
  },
};

const DEFAULT_COVER_LETTER_CONFIG: Required<CoverLetterTemplateConfig> = {
  layout: "classic",
  headerStyle: "left",
  accentColor: "#0f172a",
  bodyFont: "Inter",
  headingFont: "Inter",
  sectionSeparator: "none",
};

function normalizeFontValue(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function normalizeResumeConfig(
  config?: Partial<ResumeTemplateConfig> | null,
  fallbackId?: string
): ResumeTemplateCatalogEntry | null {
  const fallback = fallbackId ? RESUME_TEMPLATE_CATALOG_MAP[fallbackId] : undefined;
  if (!config && !fallback) return null;

  const merged: ResumeTemplateCatalogEntry = {
    ...DEFAULT_RESUME_CONFIG,
    ...(fallback ?? {}),
    ...(config ?? {}),
    palette: {
      ...DEFAULT_RESUME_CONFIG.palette,
      ...(fallback?.palette ?? {}),
      ...(config?.palette ?? {}),
    },
    background: {
      ...DEFAULT_RESUME_CONFIG.background,
      ...(fallback?.background ?? {}),
      ...(config?.background ?? {}),
    },
  };

  merged.id = merged.id || fallbackId || DEFAULT_RESUME_CONFIG.id;
  merged.name = merged.name || fallback?.name || "Custom Template";
  merged.category = merged.category || fallback?.category || "custom";
  merged.description = merged.description || fallback?.description || "";
  merged.hasPhoto = Boolean(merged.hasPhoto);
  merged.bodyFont = normalizeFontValue(merged.bodyFont, DEFAULT_RESUME_CONFIG.bodyFont);
  merged.headingFont = normalizeFontValue(merged.headingFont, DEFAULT_RESUME_CONFIG.headingFont);

  return merged;
}

export function normalizeCvConfig(config?: Partial<CvTemplateConfig> | null): Required<CvTemplateConfig> {
  const merged = {
    ...DEFAULT_CV_CONFIG,
    ...(config ?? {}),
    palette: {
      ...DEFAULT_CV_CONFIG.palette,
      ...(config?.palette ?? {}),
    },
    background: {
      ...DEFAULT_CV_CONFIG.background,
      ...(config?.background ?? {}),
    },
    hasPhoto: Boolean(config?.hasPhoto ?? DEFAULT_CV_CONFIG.hasPhoto),
  };
  merged.bodyFont = normalizeFontValue(merged.bodyFont, DEFAULT_CV_CONFIG.bodyFont);
  merged.headingFont = normalizeFontValue(merged.headingFont, DEFAULT_CV_CONFIG.headingFont);
  return merged;
}

export function normalizeCoverLetterConfig(
  config?: Partial<CoverLetterTemplateConfig> | null
): Required<CoverLetterTemplateConfig> {
  const merged = {
    ...DEFAULT_COVER_LETTER_CONFIG,
    ...(config ?? {}),
  };
  merged.bodyFont = normalizeFontValue(merged.bodyFont, DEFAULT_COVER_LETTER_CONFIG.bodyFont);
  merged.headingFont = normalizeFontValue(merged.headingFont, DEFAULT_COVER_LETTER_CONFIG.headingFont);
  return merged;
}

export function mapCvConfigToResumeConfig(
  config?: Partial<CvTemplateConfig> | null,
  fallbackId?: string
): ResumeTemplateCatalogEntry | null {
  const normalized = normalizeCvConfig(config);
  const resolvedPalette = {
    text: normalized.palette.text ?? "#0f172a",
    muted: normalized.palette.muted ?? "#475569",
    surface: normalized.palette.surface ?? "rgba(255,255,255,0.8)",
    border: normalized.palette.border ?? "rgba(148,163,184,0.3)",
  };
  const resolvedBackground = {
    backgroundColor: normalized.background.backgroundColor ?? "#ffffff",
    backgroundImage: normalized.background.backgroundImage || undefined,
    backgroundSize: normalized.background.backgroundSize || undefined,
    backgroundPosition: normalized.background.backgroundPosition || undefined,
  };
  const layout =
    normalized.layout === "two-column"
      ? normalized.sidebarPosition === "right"
        ? "sidebar-right"
        : "sidebar-left"
      : "stacked";

  return normalizeResumeConfig(
    {
      id: fallbackId || "cv-config",
      name: fallbackId || "CV Template",
      category: "cv",
      description: "",
      bodyFont: normalized.bodyFont,
      headingFont: normalized.headingFont,
      layout,
      headerStyle: normalized.headerStyle === "center" ? "center" : "left",
      sectionStyle: normalized.sectionStyle,
      bulletStyle: normalized.bulletStyle,
      ornament: normalized.ornament,
      hasPhoto: normalized.hasPhoto,
      palette: resolvedPalette,
      background: resolvedBackground,
    },
    fallbackId
  );
}
