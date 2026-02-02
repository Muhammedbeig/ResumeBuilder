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
import { useRouter, useParams } from "next/navigation";
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
  deleteResume: (id: string) => Promise<void>;
  selectResume: (resume: Resume) => void;
  saveResume: (isAutoSave?: boolean) => Promise<void>;
  syncGuestData: () => Promise<void>;
  updateTemplate: (template: string) => void;
  togglePublic: () => Promise<boolean>;
  updateResumeData: (data: Partial<ResumeData>) => void;
  updateMetadata: (metadata: Partial<NonNullable<ResumeData["metadata"]>>) => void;
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
  // Dynamic Structure
  updateStructure: (structure: import("@/types").SectionConfig[]) => void;
  rewriteBulletAI: (experienceId: string, bulletIndex: number) => Promise<void>;
  generateSummaryAI: (targetRole?: string) => Promise<void>;
  suggestSkillsAI: (jobTitle: string, description?: string) => Promise<{ hardSkills: string[]; softSkills: string[] }>;
  suggestResponsibilitiesAI: (jobTitle: string, description?: string) => Promise<string[]>;
  suggestSummaryAI: (resumeData: ResumeData, targetRole?: string) => Promise<string>;
  generatePDF?: (templateId: string) => Promise<void>;
  importedData: ResumeData | null;
  setImportedData: (data: ResumeData | null) => void;
}

export const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = "resupra_guest_resume_";

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
  const router = useRouter();
  const params = useParams();
  const currentPathId = params?.id as string;

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [currentResume, setCurrentResume] = useState<Resume | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>(emptyResumeData);
  const [importedData, setImportedData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocalResumes = useCallback(() => {
    const guestResumes: Resume[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key)!);
          guestResumes.push(parseResumeDates(data.resume));
        } catch (e) {
          console.error("Error parsing local resume", e);
        }
      }
    }
    return guestResumes;
  }, []);

  const refreshResumes = useCallback(async () => {
    const localResumes = getLocalResumes();
    
    if (!session?.user) {
      setResumes(localResumes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/resumes");
      if (!response.ok) {
        throw new Error("Failed to load resumes");
      }
      const data = await response.json();
      const remoteResumes = normalizeResumeList(data.resumes || []);
      
      // Combine remote and local (local will be synced soon)
      // Filter out local resumes that might have already been synced (redundant but safe)
      setResumes([...remoteResumes, ...localResumes].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, getLocalResumes]);

  useEffect(() => {
    refreshResumes();
  }, [session?.user, refreshResumes]);

  const syncGuestData = useCallback(async () => {
    if (!session?.user) return;
    
    const localKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
        localKeys.push(key);
      }
    }

    if (localKeys.length === 0) return;

    setIsLoading(true);
    let syncedCurrentId: string | null = null;

    try {
      for (const key of localKeys) {
        const localData = JSON.parse(localStorage.getItem(key)!);
        const oldId = localData.resume.id;

        const response = await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title: localData.resume.title, 
            template: localData.resume.template, 
            data: localData.data 
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          localStorage.removeItem(key);
          
          if (oldId === currentPathId) {
            syncedCurrentId = result.resume.id;
          }
        }
      }
      
      await refreshResumes();
      
      if (syncedCurrentId) {
        router.replace(`/resume/${syncedCurrentId}`);
      }
      
      toast.success("Syncing your guest data...");
    } catch (error) {
      console.error("Failed to sync guest data", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, refreshResumes, currentPathId, router]);

  // Trigger sync on login
  useEffect(() => {
    if (session?.user) {
      syncGuestData();
    }
  }, [session?.user, syncGuestData]);

  const createResume = useCallback(
    async (title: string, template: string, initialData?: ResumeData) => {
      const dataToUse = normalizeResumeData(initialData || emptyResumeData);
      
      if (!session?.user) {
        const guestId = `local-${Date.now()}`;
        const newResume: Resume = {
          id: guestId,
          userId: "guest",
          title,
          template,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${guestId}`, JSON.stringify({
          resume: newResume,
          data: dataToUse
        }));
        
        setResumes((prev) => [newResume, ...prev]);
        setCurrentResume(newResume);
        setResumeData(dataToUse);
        toast.success("Resume created successfully!");
        return newResume;
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, template, data: dataToUse }),
        });
        if (!response.ok) {
          throw new Error("Failed to create resume");
        }
        const payload = await response.json();
        const createdResume = parseResumeDates(payload.resume);
        setResumes((prev) => [createdResume, ...prev]);
        setCurrentResume(createdResume);
        setResumeData(normalizeResumeData(payload.data));
        toast.success("Resume created successfully!");
        return createdResume;
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user]
  );

  const loadResume = useCallback(
    async (resumeId: string) => {
      if (!resumeId) return;
      
      // If we are already loading this resume, skip
      if (currentResume?.id === resumeId) return;

      if (resumeId.startsWith("local-")) {
        const local = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${resumeId}`);
        if (local) {
          const parsed = JSON.parse(local);
          setCurrentResume(parseResumeDates(parsed.resume));
          setResumeData(normalizeResumeData(parsed.data));
        }
        return;
      }

      if (!session?.user) return;

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

  const deleteResume = useCallback(
    async (id: string) => {
      if (id.startsWith("local-")) {
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${id}`);
        setResumes((prev) => prev.filter((r) => r.id !== id));
        if (currentResume?.id === id) {
          setCurrentResume(null);
          setResumeData(emptyResumeData);
        }
        toast.success("Resume deleted");
        return;
      }

      if (!session?.user) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/resumes/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete resume");
        }
        setResumes((prev) => prev.filter((r) => r.id !== id));
        if (currentResume?.id === id) {
          setCurrentResume(null);
          setResumeData(emptyResumeData);
        }
        toast.success("Resume deleted");
      } catch (error) {
        toast.error("Failed to delete resume");
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

  const saveResume = useCallback(async (isAutoSave = false) => {
    if (!currentResume) return;

    if (currentResume.id.startsWith("local-")) {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${currentResume.id}`, JSON.stringify({
        resume: { ...currentResume, updatedAt: new Date() },
        data: resumeData
      }));
      if (!isAutoSave) toast.success("Progress saved locally");
      return;
    }

    if (!session?.user) return;
    
    if (!isAutoSave) setIsLoading(true);
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
      // Only update currentResume if it's not an auto-save to prevent re-renders or focus loss
      // Actually we should update timestamps but maybe silently
      if (!isAutoSave) {
          setCurrentResume(updatedResume);
          setResumes((prev) =>
            prev.map((resume) => (resume.id === updatedResume.id ? updatedResume : resume))
          );
      }
      // We don't need to update resumeData from server on auto-save as local is more recent
      if (!isAutoSave) {
        setResumeData(normalizeResumeData(data.data || resumeData));
        toast.success("Resume saved");
      }
    } catch (error) {
       console.error("Auto-save error:", error);
       if (!isAutoSave) toast.error("Failed to save resume");
    } finally {
      if (!isAutoSave) setIsLoading(false);
    }
  }, [session?.user, currentResume, resumeData]);

  // Auto-save effect
  useEffect(() => {
    if (!currentResume) return;

    const timer = setTimeout(() => {
      saveResume(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [resumeData, saveResume, currentResume]);

  const updateTemplate = useCallback((template: string) => {
    setCurrentResume((prev) => (prev ? { ...prev, template } : prev));
  }, []);

  const togglePublic = useCallback(async () => {
    if (!currentResume || !session?.user) return false;
    const newStatus = !currentResume.isPublic;
    
    // Optimistic update
    setCurrentResume(prev => prev ? { ...prev, isPublic: newStatus } : prev);
    
    try {
        await fetch(`/api/resumes/${currentResume.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: currentResume.title,
                template: currentResume.template,
                isPublic: newStatus,
                data: resumeData
            })
        });
        toast.success(newStatus ? "Resume is now public" : "Resume is now private");
        return newStatus;
    } catch (error) {
        // Revert
        setCurrentResume(prev => prev ? { ...prev, isPublic: !newStatus } : prev);
        toast.error("Failed to update visibility");
        return !newStatus;
    }
  }, [currentResume, session?.user, resumeData]);

  const updateResumeData = useCallback((data: Partial<ResumeData>) => {
    setResumeData((prev) => ({ ...prev, ...data }));
  }, []);

  const updateMetadata = useCallback((metadata: Partial<NonNullable<ResumeData["metadata"]>>) => {
    setResumeData((prev) => ({
      ...prev,
      metadata: { ...(prev.metadata || {}), ...metadata },
    }));
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

  const updateStructure = useCallback((structure: import("@/types").SectionConfig[]) => {
    setResumeData((prev) => ({
      ...prev,
      structure,
    }));
  }, []);

  const notifyAiLimit = useCallback(() => {
    toast.error("Free AI limit reached. Redirecting to pricing...");
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.location.href = "/pricing";
      }, 1200);
    }
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
      if (
        response.status === 429 ||
        response.status === 402 ||
        /quota|limit|resource exhausted|billing|payment/i.test(message)
      ) {
        notifyAiLimit();
      }
      throw new Error(message);
    }
    return data;
  }, [notifyAiLimit]);

  const rewriteBulletAI = useCallback(
    async (experienceId: string, bulletIndex: number) => {
      try {
        const experience = resumeData.experiences.find((exp) => exp.id === experienceId);
        if (!experience) return;
        const bullet = (experience.bullets[bulletIndex] || "").trim();
        if (!bullet) {
          toast.info("Add text to the bullet before using AI.");
          return;
        }
        setIsLoading(true);
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

  const suggestSkillsAI = useCallback(
    async (jobTitle: string, description?: string) => {
      setIsLoading(true);
      try {
        const result: any = await callAI("suggestions/skills", { jobTitle, description });
        return result || { hardSkills: [], softSkills: [] };
      } catch (error) {
        console.error("Error suggesting skills:", error);
        return { hardSkills: [], softSkills: [] };
      } finally {
        setIsLoading(false);
      }
    },
    [callAI]
  );

  const suggestResponsibilitiesAI = useCallback(
    async (jobTitle: string, description?: string) => {
      setIsLoading(true);
      try {
        const result: any = await callAI("suggestions/responsibilities", { jobTitle, description });
        return (result.responsibilities as string[]) || [];
      } catch (error) {
        console.error("Error suggesting responsibilities:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [callAI]
  );

  const suggestSummaryAI = useCallback(
    async (data: ResumeData, targetRole?: string) => {
      setIsLoading(true);
      try {
        const result: any = await callAI("summary", { resumeData: data, targetRole });
        return typeof result?.summary === "string" ? result.summary : "";
      } catch (error) {
        console.error("Error suggesting summary:", error);
        return "";
      } finally {
        setIsLoading(false);
      }
    },
    [callAI]
  );

  const value = useMemo(
    () => ({
      resumes,
      currentResume,
      resumeData,
      isLoading,
      createResume,
      loadResume,
      deleteResume,
      selectResume,
      saveResume,
      syncGuestData,
      updateTemplate,
      togglePublic,
      updateResumeData,
      updateMetadata,
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
      updateStructure,
      rewriteBulletAI,
      generateSummaryAI,
      suggestSummaryAI,
      suggestSkillsAI,
      suggestResponsibilitiesAI,
      importedData,
      setImportedData,
    }),
    [
      resumes,
      currentResume,
      resumeData,
      importedData,
      isLoading,
      createResume,
      loadResume,
      deleteResume,
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
      updateStructure,
      rewriteBulletAI,
      generateSummaryAI,
      suggestSummaryAI,
      suggestSkillsAI,
      suggestResponsibilitiesAI,
      setImportedData,
      syncGuestData,
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
