"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import type {
  Certification,
  Education,
  Experience,
  Project,
  Resume,
  ResumeData,
  SkillGroup,
} from "@/types";
import { emptyResumeData, normalizeResumeData } from "@/lib/resume-data";
import { toast } from "sonner";

interface ResumeContextType {
  resumes: Resume[];
  currentResume: Resume | null;
  resumeData: ResumeData;
  isLoading: boolean;
  createResume: (title: string, template: string, initialData?: ResumeData) => Promise<Resume>;
  loadResume: (resumeId: string) => Promise<void>;
  selectResume: (resume: Resume) => void;
  saveResume: () => Promise<void>;
  updateTemplate: (template: string) => void;
  updateResumeData: (data: Partial<ResumeData>) => void;
  updateBasics: (basics: Partial<ResumeData["basics"]>) => void;
  addExperience: (experience: Omit<Experience, "id">) => void;
  updateExperience: (id: string, experience: Partial<Experience>) => void;
  removeExperience: (id: string) => void;
  addEducation: (education: Omit<Education, "id">) => void;
  updateEducation: (id: string, education: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  addProject: (project: Omit<Project, "id">) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addSkillGroup: (group: Omit<SkillGroup, "id">) => void;
  updateSkillGroup: (id: string, group: Partial<SkillGroup>) => void;
  removeSkillGroup: (id: string) => void;
  addCertification: (cert: Omit<Certification, "id">) => void;
  removeCertification: (id: string) => void;
  rewriteBulletAI: (experienceId: string, bulletIndex: number) => Promise<void>;
  generateSummaryAI: (targetRole?: string) => Promise<void>;
  extractSkillsAI: (text: string) => Promise<string[]>;
  tailorToJobAI: (jobDescription: string) => Promise<unknown>;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

function parseResumeDates(resume: Resume): Resume {
  return {
    ...resume,
    createdAt: new Date(resume.createdAt),
    updatedAt: new Date(resume.updatedAt),
  };
}

function normalizeResumeList(resumes: Resume[]): Resume[] {
  return resumes.map(parseResumeDates);
}

export function ResumeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [currentResume, setCurrentResume] = useState<Resume | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>(emptyResumeData);
  const [isLoading, setIsLoading] = useState(false);

  const refreshResumes = useCallback(async () => {
    if (!session?.user) {
      setResumes([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/resumes");
      if (!response.ok) {
        throw new Error("Failed to load resumes");
      }
      const data = await response.json();
      setResumes(normalizeResumeList(data.resumes || []));
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      refreshResumes();
    } else {
      setResumes([]);
      setCurrentResume(null);
      setResumeData(emptyResumeData);
    }
  }, [session?.user, refreshResumes]);

  const createResume = useCallback(
    async (title: string, template: string, initialData?: ResumeData) => {
      if (!session?.user) {
        throw new Error("Not authenticated");
      }
      setIsLoading(true);
      try {
        const response = await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, template, data: initialData }),
        });
        if (!response.ok) {
          throw new Error("Failed to create resume");
        }
        const payload = await response.json();
        const createdResume = parseResumeDates(payload.resume);
        setResumes((prev) => [createdResume, ...prev]);
        setCurrentResume(createdResume);
        setResumeData(normalizeResumeData(payload.data));
        return createdResume;
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user]
  );

  const loadResume = useCallback(
    async (resumeId: string) => {
      if (!session?.user || !resumeId) return;
      if (currentResume?.id === resumeId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/resumes/${resumeId}`);
        if (!response.ok) {
          throw new Error("Failed to load resume");
        }
        const data = await response.json();
        const loadedResume = parseResumeDates(data.resume);
        setCurrentResume(loadedResume);
        setResumeData(normalizeResumeData(data.data));
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user, currentResume?.id]
  );

  const selectResume = useCallback(
    (resume: Resume) => {
      setCurrentResume(resume);
      void loadResume(resume.id);
    },
    [loadResume]
  );

  const saveResume = useCallback(async () => {
    if (!session?.user || !currentResume) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/resumes/${currentResume.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentResume.title,
          template: currentResume.template,
          isPublic: currentResume.isPublic,
          data: resumeData,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save resume");
      }
      const data = await response.json();
      const updatedResume = parseResumeDates(data.resume);
      setCurrentResume(updatedResume);
      setResumeData(normalizeResumeData(data.data || resumeData));
      setResumes((prev) =>
        prev.map((resume) => (resume.id === updatedResume.id ? updatedResume : resume))
      );
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, currentResume, resumeData]);

  const updateTemplate = useCallback((template: string) => {
    setCurrentResume((prev) => (prev ? { ...prev, template } : prev));
  }, []);

  const updateResumeData = useCallback((data: Partial<ResumeData>) => {
    setResumeData((prev) => ({ ...prev, ...data }));
  }, []);

  const updateBasics = useCallback((basics: Partial<ResumeData["basics"]>) => {
    setResumeData((prev) => ({
      ...prev,
      basics: { ...prev.basics, ...basics },
    }));
  }, []);

  const addExperience = useCallback((experience: Omit<Experience, "id">) => {
    const newExp: Experience = { ...experience, id: Date.now().toString() };
    setResumeData((prev) => ({
      ...prev,
      experiences: [...prev.experiences, newExp],
    }));
  }, []);

  const updateExperience = useCallback((id: string, experience: Partial<Experience>) => {
    setResumeData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id ? { ...exp, ...experience } : exp
      ),
    }));
  }, []);

  const removeExperience = useCallback((id: string) => {
    setResumeData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id),
    }));
  }, []);

  const addEducation = useCallback((education: Omit<Education, "id">) => {
    const newEdu: Education = { ...education, id: Date.now().toString() };
    setResumeData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  }, []);

  const updateEducation = useCallback((id: string, education: Partial<Education>) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu) => (edu.id === id ? { ...edu, ...education } : edu)),
    }));
  }, []);

  const removeEducation = useCallback((id: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  }, []);

  const addProject = useCallback((project: Omit<Project, "id">) => {
    const newProj: Project = { ...project, id: Date.now().toString() };
    setResumeData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
    }));
  }, []);

  const updateProject = useCallback((id: string, project: Partial<Project>) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) => (proj.id === id ? { ...proj, ...project } : proj)),
    }));
  }, []);

  const removeProject = useCallback((id: string) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((proj) => proj.id !== id),
    }));
  }, []);

  const addSkillGroup = useCallback((group: Omit<SkillGroup, "id">) => {
    const newGroup: SkillGroup = { ...group, id: Date.now().toString() };
    setResumeData((prev) => ({
      ...prev,
      skills: [...prev.skills, newGroup],
    }));
  }, []);

  const updateSkillGroup = useCallback((id: string, group: Partial<SkillGroup>) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.map((skill) => (skill.id === id ? { ...skill, ...group } : skill)),
    }));
  }, []);

  const removeSkillGroup = useCallback((id: string) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill.id !== id),
    }));
  }, []);

  const addCertification = useCallback((cert: Omit<Certification, "id">) => {
    const newCert: Certification = { ...cert, id: Date.now().toString() };
    setResumeData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, newCert],
    }));
  }, []);

  const removeCertification = useCallback((id: string) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((cert) => cert.id !== id),
    }));
  }, []);

  const callAI = useCallback(async (path: string, payload: Record<string, unknown>) => {
    const response = await fetch(`/api/ai/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");
    if (!response.ok) {
      const message =
        data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error
          : "AI request failed";
      throw new Error(message);
    }
    return data;
  }, []);

  const rewriteBulletAI = useCallback(
    async (experienceId: string, bulletIndex: number) => {
      setIsLoading(true);
      try {
        const experience = resumeData.experiences.find((exp) => exp.id === experienceId);
        if (!experience) return;
        const bullet = experience.bullets[bulletIndex];
        const context = `Role: ${experience.role} at ${experience.company}`;
        const result = await callAI("rewrite", { bullet, context });
        const rewritten = result.rewritten as string;
        setResumeData((prev) => ({
          ...prev,
          experiences: prev.experiences.map((exp) =>
            exp.id === experienceId
              ? {
                  ...exp,
                  bullets: exp.bullets.map((b, i) => (i === bulletIndex ? rewritten : b)),
                }
              : exp
          ),
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI request failed";
        toast.error(message);
        console.error("Error rewriting bullet:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [resumeData.experiences, callAI]
  );

  const generateSummaryAI = useCallback(
    async (targetRole?: string) => {
      setIsLoading(true);
      try {
        const result = await callAI("summary", { resumeData, targetRole });
        const summary = result.summary as string;
        setResumeData((prev) => ({
          ...prev,
          basics: { ...prev.basics, summary },
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI request failed";
        toast.error(message);
        console.error("Error generating summary:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [resumeData, callAI]
  );

  const extractSkillsAI = useCallback(
    async (text: string) => {
      setIsLoading(true);
      try {
        const result = await callAI("skills", { text });
        return (result.skills as string[]) || [];
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI request failed";
        toast.error(message);
        console.error("Error extracting skills:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [callAI]
  );

  const tailorToJobAI = useCallback(
    async (jobDescription: string) => {
      setIsLoading(true);
      try {
        const result = await callAI("tailor", {
          resumeData,
          jobDescription,
        });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI request failed";
        toast.error(message);
        console.error("Error tailoring resume:", error);
        return {
          matchScore: 0,
          matchedKeywords: [],
          missingKeywords: [],
          suggestions: [],
        };
      } finally {
        setIsLoading(false);
      }
    },
    [resumeData, callAI]
  );

  const value = useMemo(
    () => ({
      resumes,
      currentResume,
      resumeData,
      isLoading,
      createResume,
      loadResume,
      selectResume,
      saveResume,
      updateTemplate,
      updateResumeData,
      updateBasics,
      addExperience,
      updateExperience,
      removeExperience,
      addEducation,
      updateEducation,
      removeEducation,
      addProject,
      updateProject,
      removeProject,
      addSkillGroup,
      updateSkillGroup,
      removeSkillGroup,
      addCertification,
      removeCertification,
      rewriteBulletAI,
      generateSummaryAI,
      extractSkillsAI,
      tailorToJobAI,
    }),
    [
      resumes,
      currentResume,
      resumeData,
      isLoading,
      createResume,
      loadResume,
      selectResume,
      saveResume,
      updateTemplate,
      updateResumeData,
      updateBasics,
      addExperience,
      updateExperience,
      removeExperience,
      addEducation,
      updateEducation,
      removeEducation,
      addProject,
      updateProject,
      removeProject,
      addSkillGroup,
      updateSkillGroup,
      removeSkillGroup,
      addCertification,
      removeCertification,
      rewriteBulletAI,
      generateSummaryAI,
      extractSkillsAI,
      tailorToJobAI,
    ]
  );

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

export function useResume() {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error("useResume must be used within a ResumeProvider");
  }
  return context;
}
