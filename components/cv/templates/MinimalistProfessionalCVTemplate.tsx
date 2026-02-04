"use client";

import type { ResumeData } from "@/types";
import { MinimalistProfessionalTemplate } from "@/components/resume/templates/MinimalistProfessionalTemplate";

interface MinimalistProfessionalCVTemplateProps {
  data: ResumeData;
  className?: string;
}

export function MinimalistProfessionalCVTemplate({
  data,
  className = "",
}: MinimalistProfessionalCVTemplateProps) {
  return <MinimalistProfessionalTemplate data={data} className={className} />;
}
