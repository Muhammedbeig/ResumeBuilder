import { z } from "zod";

// Shared Schemas
const DateRangeSchema = z.object({
  startDate: z.string(), // "YYYY-MM" or "YYYY"
  endDate: z.string().optional(), // "YYYY-MM" or "Present"
  current: z.boolean().default(false),
});

export const ExperienceSchema = z.object({
  id: z.string().uuid().or(z.string()),
  company: z.string(),
  role: z.string(),
  location: z.string().default(""),
  startDate: z.string(),
  endDate: z.string().default("Present"),
  current: z.boolean().default(false),
  bullets: z.array(z.string()),
});

export const EducationSchema = z.object({
  id: z.string().uuid().or(z.string()),
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string().default("Present"),
  gpa: z.string().optional(),
});

export const SkillGroupSchema = z.object({
  id: z.string().uuid().or(z.string()),
  name: z.string(),
  skills: z.array(z.string()),
});

export const ProjectSchema = z.object({
  id: z.string().uuid().or(z.string()),
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  link: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
});

export const CertificationSchema = z.object({
  id: z.string().uuid().or(z.string()),
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
  link: z.string().url().optional().or(z.literal("")),
});

export const LanguageSchema = z.object({
  id: z.string().uuid().or(z.string()),
  name: z.string(),
  proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Native']),
});

export const ResumeDataSchema = z.object({
  basics: z.object({
    name: z.string(),
    title: z.string(),
    image: z.string().url().optional().or(z.literal("")),
    location: z.string().default(""),
    email: z.string().email(),
    phone: z.string().default(""),
    linkedin: z.string().url().optional().or(z.literal("")),
    github: z.string().url().optional().or(z.literal("")),
    portfolio: z.string().url().optional().or(z.literal("")),
    summary: z.string(),
  }),
  experiences: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(SkillGroupSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  languages: z.array(LanguageSchema).default([]),
});

// Metadata schema for styling and configuration
export const ResumeMetadataSchema = z.object({
  templateId: z.string().default("modern"),
  themeColor: z.string().default("#000000"),
  fontFamily: z.string().default("inter"),
  paperSize: z.enum(["a4", "letter"]).default("a4"),
});

// The Full Resume Object
export const ResumeSchema = z.object({
  id: z.string().uuid().or(z.string()),
  data: ResumeDataSchema,
  metadata: ResumeMetadataSchema,
});

export type ResumeData = z.infer<typeof ResumeDataSchema>;
export type ResumeMetadata = z.infer<typeof ResumeMetadataSchema>;
export type Resume = z.infer<typeof ResumeSchema>;
