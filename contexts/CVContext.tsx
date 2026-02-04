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
  Resume, // We reuse Resume type structure for CV as they are identical in data shape
  ResumeData,
  SkillGroup,
} from "@/types";
import { emptyResumeData, normalizeResumeData } from "@/lib/resume-data";
import { getSuggestedBullets } from "@/lib/experience-suggestions";
import { extractSummarySuggestions } from "@/lib/summary-suggestions";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { toast } from "sonner";

// Reusing Resume type alias for CV to avoid duplicating types if they are identical
type CV = Resume; 

interface CVContextType {
  cvs: CV[];
  currentCV: CV | null;
  cvData: ResumeData;
  isLoading: boolean;
  createCV: (title: string, template: string, initialData?: ResumeData) => Promise<CV>;
  loadCV: (cvId: string) => Promise<void>;
  deleteCV: (id: string) => Promise<void>;
  selectCV: (cv: CV) => void;
  saveCV: (isAutoSave?: boolean) => Promise<void>;
  syncGuestData: () => Promise<void>;
  updateTemplate: (template: string) => void;
  updateCVData: (data: Partial<ResumeData>) => void;
  updateBasics: (basics: Partial<ResumeData["basics"]>) => void;
  updateMetadata: (metadata: Partial<NonNullable<ResumeData["metadata"]>>) => void;
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
  suggestSummaryAI: (resumeData: ResumeData, targetRole?: string) => Promise<string[]>;
  suggestSkillsAI: (jobTitle: string, description?: string) => Promise<{ hardSkills: string[]; softSkills: string[] }>;
  suggestResponsibilitiesAI: (jobTitle: string, description?: string) => Promise<string[]>;
  generatePDF?: (templateId: string) => Promise<void>;
  importedData: ResumeData | null;
  setImportedData: (data: ResumeData | null) => void;
}

export const CVContext = createContext<CVContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = "resupra_guest_cv_";

function parseCVDates(cv: CV): CV {
  return {
    ...cv,
    createdAt: new Date(cv.createdAt),
    updatedAt: new Date(cv.updatedAt),
  };
}

function normalizeCVList(cvs: CV[]): CV[] {
  return cvs.map(parseCVDates);
}

export function CVProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const { planChoice } = usePlanChoice();
  const router = useRouter();
  const params = useParams();
  const currentPathId = params?.id as string;

  const [cvs, setCVs] = useState<CV[]>([]);
  const [currentCV, setCurrentCV] = useState<CV | null>(null);
  const [cvData, setCVData] = useState<ResumeData>(emptyResumeData);
  const [importedData, setImportedData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasSubscription = useMemo(
    () => session?.user?.subscription === "pro" || session?.user?.subscription === "business",
    [session?.user?.subscription]
  );
  const canUsePaid = useMemo(
    () => planChoice === "paid" || hasSubscription,
    [planChoice, hasSubscription]
  );

  const getLocalCVs = useCallback(() => {
    const guestCVs: CV[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key)!);
          guestCVs.push(parseCVDates(data.cv));
        } catch (e) {
          console.error("Error parsing local CV", e);
        }
      }
    }
    return guestCVs;
  }, []);

  const refreshCVs = useCallback(async () => {
    const localCVs = getLocalCVs();

    if (!session?.user) {
      setCVs(localCVs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/cvs");
      if (!response.ok) {
        console.error("Failed to load CVs", response.status);
        setCVs(localCVs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
        return;
      }
      const data = await response.json();
      const remoteCVs = normalizeCVList(data.cvs || []);
      setCVs([...remoteCVs, ...localCVs].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    } catch (error) {
      console.error("Failed to load CVs", error);
      setCVs(localCVs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, getLocalCVs]);

  useEffect(() => {
    refreshCVs();
  }, [session?.user, refreshCVs]);

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
        const oldId = localData.cv.id;

        const response = await fetch("/api/cvs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title: localData.cv.title, 
            template: localData.cv.template, 
            data: localData.data 
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          localStorage.removeItem(key);

          if (oldId === currentPathId) {
            syncedCurrentId = result.cv.id;
          }
        }
      }
      await refreshCVs();

      if (syncedCurrentId) {
        router.replace(`/cv/${syncedCurrentId}`);
      }

      toast.success("Syncing your guest data...");
    } catch (error) {
      console.error("Failed to sync guest data", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, refreshCVs, currentPathId, router]);

  useEffect(() => {
    if (session?.user) {
      syncGuestData();
    }
  }, [session?.user, syncGuestData]);

  const createCV = useCallback(
    async (title: string, template: string, initialData?: ResumeData) => {
      const dataToUse = normalizeResumeData(initialData || emptyResumeData);

      if (!session?.user) {
        const guestId = `local-${Date.now()}`;
        const newCV: CV = {
          id: guestId,
          userId: "guest",
          title,
          template,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${guestId}`, JSON.stringify({
          cv: newCV,
          data: dataToUse
        }));
        
        setCVs((prev) => [newCV, ...prev]);
        setCurrentCV(newCV);
        setCVData(dataToUse);
        return newCV;
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/cvs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, template, data: dataToUse }),
        });
        if (!response.ok) {
          throw new Error("Failed to create CV");
        }
        const payload = await response.json();
        const createdCV = parseCVDates(payload.cv);
        setCVs((prev) => [createdCV, ...prev]);
        setCurrentCV(createdCV);
        setCVData(normalizeResumeData(payload.data));
        return createdCV;
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user]
  );

  const loadCV = useCallback(
    async (cvId: string) => {
      if (!cvId) return;
      if (currentCV?.id === cvId) return;

      if (cvId.startsWith("local-")) {
        const local = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${cvId}`);
        if (local) {
          const parsed = JSON.parse(local);
          setCurrentCV(parseCVDates(parsed.cv));
          setCVData(normalizeResumeData(parsed.data));
        }
        return;
      }

      if (!session?.user) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/cvs/${cvId}`);
        if (!response.ok) {
          throw new Error("Failed to load CV");
        }
        const data = await response.json();
        const loadedCV = parseCVDates(data.cv);
        setCurrentCV(loadedCV);
        setCVData(normalizeResumeData(data.data));
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user, currentCV?.id]
  );

  const deleteCV = useCallback(
    async (id: string) => {
      if (id.startsWith("local-")) {
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${id}`);
        setCVs((prev) => prev.filter((cv) => cv.id !== id));
        if (currentCV?.id === id) {
          setCurrentCV(null);
          setCVData(emptyResumeData);
        }
        toast.success("CV deleted");
        return;
      }

      if (!session?.user) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/cvs/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete CV");
        }
        setCVs((prev) => prev.filter((cv) => cv.id !== id));
        if (currentCV?.id === id) {
          setCurrentCV(null);
          setCVData(emptyResumeData);
        }
        toast.success("CV deleted");
      } catch (error) {
        toast.error("Failed to delete CV");
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user, currentCV?.id]
  );

  const selectCV = useCallback(
    (cv: CV) => {
      setCurrentCV(cv);
      void loadCV(cv.id);
    },
    [loadCV]
  );

  const saveCV = useCallback(async (isAutoSave = false) => {
    if (!currentCV) return;

    if (currentCV.id.startsWith("local-")) {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${currentCV.id}`, JSON.stringify({
        cv: { ...currentCV, updatedAt: new Date() },
        data: cvData
      }));
      if (!isAutoSave) toast.success("Progress saved locally");
      return;
    }

    if (!session?.user) return;

    if (!isAutoSave) setIsLoading(true);
    try {
      const response = await fetch(`/api/cvs/${currentCV.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentCV.title,
          template: currentCV.template,
          isPublic: currentCV.isPublic,
          data: cvData,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save CV");
      }
      const data = await response.json();
      const updatedCV = parseCVDates(data.cv);
      
      if (!isAutoSave) {
          setCurrentCV(updatedCV);
          setCVs((prev) =>
            prev.map((cv) => (cv.id === updatedCV.id ? updatedCV : cv))
          );
          setCVData(normalizeResumeData(data.data || cvData));
          toast.success("CV saved");
      }
    } catch (error) {
        console.error("Auto-save error:", error);
        if (!isAutoSave) toast.error("Failed to save CV");
    } finally {
      if (!isAutoSave) setIsLoading(false);
    }
  }, [session?.user, currentCV, cvData]);

  // Auto-save effect
  useEffect(() => {
    if (!currentCV) return;

    const timer = setTimeout(() => {
      saveCV(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [cvData, saveCV, currentCV]);

  const updateTemplate = useCallback((template: string) => {
    setCurrentCV((prev) => (prev ? { ...prev, template } : prev));
  }, []);

  const updateCVData = useCallback((data: Partial<ResumeData>) => {
    setCVData((prev) => ({ ...prev, ...data }));
  }, []);

  const updateBasics = useCallback((basics: Partial<ResumeData["basics"]>) => {
    setCVData((prev) => ({
      ...prev,
      basics: { ...prev.basics, ...basics },
    }));
  }, []);

  const updateMetadata = useCallback((metadata: Partial<NonNullable<ResumeData["metadata"]>>) => {
    setCVData((prev) => ({
      ...prev,
      metadata: { ...(prev.metadata || {}), ...metadata },
    }));
  }, []);

  const addExperience = useCallback((experience: Omit<Experience, "id">) => {
    const newExp: Experience = { ...experience, id: Date.now().toString() };
    setCVData((prev) => ({
      ...prev,
      experiences: [...prev.experiences, newExp],
    }));
  }, []);

  const updateExperience = useCallback((id: string, experience: Partial<Experience>) => {
    setCVData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id ? { ...exp, ...experience } : exp
      ),
    }));
  }, []);

  const removeExperience = useCallback((id: string) => {
    setCVData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id),
    }));
  }, []);

  const addEducation = useCallback((education: Omit<Education, "id">) => {
    const newEdu: Education = { ...education, id: Date.now().toString() };
    setCVData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  }, []);

  const updateEducation = useCallback((id: string, education: Partial<Education>) => {
    setCVData((prev) => ({
      ...prev,
      education: prev.education.map((edu) => (edu.id === id ? { ...edu, ...education } : edu)),
    }));
  }, []);

  const removeEducation = useCallback((id: string) => {
    setCVData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  }, []);

  const addProject = useCallback((project: Omit<Project, "id">) => {
    const newProj: Project = { ...project, id: Date.now().toString() };
    setCVData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
    }));
  }, []);

  const updateProject = useCallback((id: string, project: Partial<Project>) => {
    setCVData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) => (proj.id === id ? { ...proj, ...project } : proj)),
    }));
  }, []);

  const removeProject = useCallback((id: string) => {
    setCVData((prev) => ({
      ...prev,
      projects: prev.projects.filter((proj) => proj.id !== id),
    }));
  }, []);

  const addSkillGroup = useCallback((group: Omit<SkillGroup, "id">) => {
    const newGroup: SkillGroup = { ...group, id: Date.now().toString() };
    setCVData((prev) => ({
      ...prev,
      skills: [...prev.skills, newGroup],
    }));
  }, []);

  const updateSkillGroup = useCallback((id: string, group: Partial<SkillGroup>) => {
    setCVData((prev) => ({
      ...prev,
      skills: prev.skills.map((skill) => (skill.id === id ? { ...skill, ...group } : skill)),
    }));
  }, []);

  const removeSkillGroup = useCallback((id: string) => {
    setCVData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill.id !== id),
    }));
  }, []);

  const addCertification = useCallback((cert: Omit<Certification, "id">) => {
    const newCert: Certification = { ...cert, id: Date.now().toString() };
    setCVData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, newCert],
    }));
  }, []);

  const removeCertification = useCallback((id: string) => {
    setCVData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((cert) => cert.id !== id),
    }));
  }, []);

  const updateStructure = useCallback((structure: import("@/types").SectionConfig[]) => {
    setCVData((prev) => ({
      ...prev,
      structure,
    }));
  }, []);

  const notifyAiLimit = useCallback(() => {
    toast.error("AI limit has done.");
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
      const isLimit = /quota|limit|resource exhausted|billing|payment/i.test(message);
      if (response.status === 429 || (response.status === 402 && isLimit)) {
        notifyAiLimit();
      }
      throw new Error(message);
    }
    return data;
  }, [notifyAiLimit]);

  const rewriteBulletAI = useCallback(
    async (experienceId: string, bulletIndex: number) => {
      if (!canUsePaid) {
        toast.info("AI tools are not available in this version.");
        return;
      }
      try {
        const experience = cvData.experiences.find((exp) => exp.id === experienceId);
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
        setCVData((prev) => ({
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
    [cvData.experiences, callAI, canUsePaid]
  );

  const generateSummaryAI = useCallback(
    async (targetRole?: string) => {
      if (!canUsePaid) {
        toast.info("AI tools are not available in this version.");
        return;
      }
      setIsLoading(true);
      try {
        const result = await callAI("summary", { resumeData: cvData, targetRole });
        const suggestions = extractSummarySuggestions(result);
        const summary = suggestions[0] ?? "";
        setCVData((prev) => ({
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
    [cvData, callAI, canUsePaid]
  );

  const suggestSummaryAI = useCallback(
    async (data: ResumeData, targetRole?: string) => {
      if (!canUsePaid) {
        return [];
      }
      setIsLoading(true);
      try {
        const result: any = await callAI("summary", { resumeData: data, targetRole });
        return extractSummarySuggestions(result).slice(0, 3);
      } catch (error) {
        console.error("Error suggesting summary:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [callAI, canUsePaid]
  );

  const suggestSkillsAI = useCallback(
    async (jobTitle: string, description?: string) => {
      if (!canUsePaid) {
        return { hardSkills: [], softSkills: [] };
      }
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
    [callAI, canUsePaid]
  );

  const suggestResponsibilitiesAI = useCallback(
    async (jobTitle: string, description?: string) => {
      if (!canUsePaid) {
        return getSuggestedBullets(jobTitle, 8);
      }
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
    [callAI, canUsePaid]
  );

  const value = useMemo(
    () => ({
      cvs,
      currentCV,
      cvData,
      isLoading,
      createCV,
      loadCV,
      deleteCV,
      selectCV,
      saveCV,
      syncGuestData,
      updateTemplate,
      updateCVData,
      updateBasics,
      updateMetadata,
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
      cvs,
      currentCV,
      cvData,
      importedData,
      isLoading,
      createCV,
      loadCV,
      deleteCV,
      selectCV,
      saveCV,
      syncGuestData,
      updateTemplate,
      updateCVData,
      updateBasics,
      updateMetadata,
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
    ]
  );

  return <CVContext.Provider value={value}>{children}</CVContext.Provider>;
}

export function useCV() {
  const context = useContext(CVContext);
  if (context === undefined) {
    throw new Error("useCV must be used within a CVProvider");
  }
  return context;
}
