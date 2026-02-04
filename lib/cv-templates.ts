import { AcademicCVTemplate } from "@/components/cv/templates/AcademicCVTemplate";
import { ModernCVTemplate } from "@/components/cv/templates/ModernCVTemplate";
import { MinimalistProfessionalCVTemplate } from "@/components/cv/templates/MinimalistProfessionalCVTemplate";

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
  {
    id: "minimalist-professional-cv",
    name: "Minimalist Professional CV",
    premium: false,
    description: "Minimalist two-column CV with photo and clean typography.",
    component: MinimalistProfessionalCVTemplate,
  },
] as const;

export const cvTemplateMap = {
  "academic-cv": AcademicCVTemplate,
  "executive-cv": ModernCVTemplate,
  "minimalist-professional-cv": MinimalistProfessionalCVTemplate,
} as const;
