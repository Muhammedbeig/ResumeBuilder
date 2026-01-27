import type { ResumeData, SectionConfig } from "@/types";

export const defaultSectionOrder: SectionConfig[] = [
  { id: 'basics', type: 'basics', title: 'Personal Info', isVisible: true, order: 0 },
  { id: 'summary', type: 'summary', title: 'Professional Summary', isVisible: true, order: 1 },
  { id: 'experience', type: 'experience', title: 'Experience', isVisible: true, order: 2 },
  { id: 'education', type: 'education', title: 'Education', isVisible: true, order: 3 },
  { id: 'skills', type: 'skills', title: 'Skills', isVisible: true, order: 4 },
  { id: 'projects', type: 'projects', title: 'Projects', isVisible: true, order: 5 },
  { id: 'certifications', type: 'certifications', title: 'Certifications', isVisible: true, order: 6 },
];

export const emptyResumeData: ResumeData = {
  basics: {
    name: "",
    title: "",
    location: "",
    email: "",
    phone: "",
    summary: "",
  },
  experiences: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  structure: defaultSectionOrder,
};

export function normalizeResumeData(data?: Partial<ResumeData> | null): ResumeData {
  if (!data) return { ...emptyResumeData };
  return {
    basics: { ...emptyResumeData.basics, ...(data.basics || {}) },
    experiences: data.experiences || [],
    education: data.education || [],
    skills: data.skills || [],
    projects: data.projects || [],
    certifications: data.certifications || [],
    languages: data.languages || [],
    structure: data.structure || defaultSectionOrder,
  };
}
