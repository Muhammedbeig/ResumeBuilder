import type { ResumeData } from "@/types";

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
  };
}
