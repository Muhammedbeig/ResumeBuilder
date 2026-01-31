// Core Types for Resume Builder

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  subscription?: 'free' | 'pro' | 'business';
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  template: string;
  isPublic: boolean;
  activeVersionId?: string;
  createdAt: Date;
  updatedAt: Date;
  versions?: ResumeVersion[];
}

export interface ResumeVersion {
  id: string;
  resumeId: string;
  jsonData: ResumeData;
  source: 'upload' | 'manual' | 'ai';
  createdAt: Date;
}

export interface ResumeData {
  basics: {
    name: string;
    title: string;
    image?: string;
    location: string;
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    summary: string;
  };
  experiences: Experience[];
  education: Education[];
  skills: SkillGroup[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  
  // Section Ordering & Visibility
  structure?: SectionConfig[];

  // Design & Appearance
  metadata?: {
    themeColor?: string;
    fontFamily?: string;
    fontSize?: string;
  };
}

export interface SectionConfig {
  id: string;
  type: 'basics' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'summary' | 'custom';
  title: string;
  isVisible: boolean;
  order: number;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface SkillGroup {
  id: string;
  name: string;
  skills: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  github?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link?: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Native';
}

export interface Template {
  id: string;
  name: string;
  preview: string;
  category: 'ats' | 'modern' | 'creative';
  colors: string[];
}

export interface JobDescription {
  title: string;
  company: string;
  description: string;
  requirements: string[];
}

export interface TailoringResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: {
    experienceId: string;
    bulletIndex: number;
    original: string;
    suggested: string;
    keywords: string[];
  }[];
}

export interface ExportJob {
  id: string;
  resumeId: string;
  resumeVersionId: string;
  fileUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface CoverLetter {
  id: string;
  userId: string;
  title: string;
  template: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoverLetterData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
  };
  recipientInfo: {
    managerName: string;
    companyName: string;
    address: string;
    city: string;
    zipCode: string;
    email: string;
  };
  content: {
    subject: string;
    greeting: string;
    opening: string;
    body: string;
    closing: string;
    signature: string;
  };
  metadata?: {
    themeColor?: string;
    fontFamily?: string;
    fontSize?: string;
  };
}
