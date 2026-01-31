import { ModernTemplate } from "@/components/resume/templates/ModernTemplate";
import { ATSTemplate } from "@/components/resume/templates/ATSTemplate";
import { ExecutiveTemplate } from "@/components/resume/templates/ExecutiveTemplate";
import { ClassicTemplate } from "@/components/resume/templates/ClassicTemplate";
import { ProfessionalTemplate } from "@/components/resume/templates/ProfessionalTemplate";
import { CreativeTemplate } from "@/components/resume/templates/CreativeTemplate";
import { MinimalistPhotoTemplate } from "@/components/resume/templates/MinimalistPhotoTemplate";
import { TechModernTemplate } from "@/components/resume/templates/TechModernTemplate";
import { ImpactTemplate } from "@/components/resume/templates/ImpactTemplate";
import { MinimalTemplate } from "@/components/resume/templates/MinimalTemplate";

export const resumeTemplates = [
  {
    id: "classic",
    name: "Classic",
    premium: false,
    description: "LaTeX-inspired, clean PDF-style resume.",
    component: ClassicTemplate,
  },
  {
    id: "modern",
    name: "Modern",
    premium: false,
    description: "Clean, contemporary layout with balanced spacing.",
    component: ModernTemplate,
  },
  {
    id: "impact",
    name: "Impact",
    premium: true,
    description: "Bold, sidebar-driven design for making a strong first impression.",
    component: ImpactTemplate,
  },
  {
    id: "minimal",
    name: "Minimal",
    premium: false,
    description: "Ultra-clean, whitespace-focused design with black typography.",
    component: MinimalTemplate,
  },
  {
    id: "tech-modern",
    name: "Tech Modern",
    premium: true,
    description: "Vibrant, tech-focused design with a modern header.",
    component: TechModernTemplate,
  },
  {
    id: "minimalist-photo",
    name: "Minimalist Photo",
    premium: false,
    description: "Clean sidebar layout with a prominent photo area.",
    component: MinimalistPhotoTemplate,
  },
  {
    id: "ats",
    name: "ATS",
    premium: false,
    description: "Ultra-readable, ATS-optimized structure for recruiters.",
    component: ATSTemplate,
  },
  {
    id: "executive",
    name: "Executive",
    premium: false,
    description: "Premium leadership template with strong hierarchy.",
    component: ExecutiveTemplate,
  },
  {
    id: "professional",
    name: "Professional",
    premium: false,
    description: "Elegant serif typography with a centered header.",
    component: ProfessionalTemplate,
  },
  {
    id: "creative",
    name: "Creative",
    premium: false,
    description: "Bold two-column design with a dark sidebar.",
    component: CreativeTemplate,
  },
] as const;

export const resumeTemplateMap = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  ats: ATSTemplate,
  impact: ImpactTemplate,
  minimal: MinimalTemplate,
  executive: ExecutiveTemplate,
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
  "tech-modern": TechModernTemplate,
  "minimalist-photo": MinimalistPhotoTemplate,
} as const;
