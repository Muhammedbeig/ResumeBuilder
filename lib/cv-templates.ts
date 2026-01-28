import { AcademicCVTemplate } from "@/components/cv/templates/AcademicCVTemplate";
import { ModernCVTemplate } from "@/components/cv/templates/ModernCVTemplate";

export const cvTemplates = [
  {
    id: "academic-cv",
    name: "Academic CV",
    premium: false,
    description: "Traditional serif layout, dense and elegant. Perfect for research and academia.",
    component: AcademicCVTemplate,
  },
  {
    id: "executive-cv",
    name: "Executive CV",
    premium: true,
    description: "Modern two-column layout with a bold sidebar and teal accents.",
    component: ModernCVTemplate,
  },
] as const;

export const cvTemplateMap = {
  "academic-cv": AcademicCVTemplate,
  "executive-cv": ModernCVTemplate,
} as const;
