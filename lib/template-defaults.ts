import { RESUME_TEMPLATE_CATALOG } from "./resume-template-catalog";

const CATALOG_DEFAULT_FONTS = Object.fromEntries(
  RESUME_TEMPLATE_CATALOG.map((template) => [template.id, template.bodyFont])
);

export const RESUME_TEMPLATE_DEFAULT_FONTS: Record<string, string> = {
  classic: "Inter",
  modern: "Inter",
  impact: "Inter",
  minimal: "Inter",
  "tech-modern": "Inter",
  "minimalist-photo": "Inter",
  ats: "Inter",
  executive: "Inter",
  professional: "Merriweather",
  creative: "Inter",
  "minimalist-professional": "Poppins",
  ...CATALOG_DEFAULT_FONTS,
};

export const CV_TEMPLATE_DEFAULT_FONTS: Record<string, string> = {
  "academic-cv": "Times New Roman",
  "executive-cv": "Inter",
  "minimalist-professional-cv": "Poppins",
};

export const COVER_LETTER_DEFAULT_FONTS: Record<string, string> = {
  modern: "Inter",
  professional: "Inter",
  creative: "Inter",
};
