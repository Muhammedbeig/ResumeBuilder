"use client";

import {
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Certification,
  Education,
  Experience,
  Project,
  Resume,
  ResumeData,
  SkillGroup,
} from "@/types";
import { ResumeContext } from "@/contexts/ResumeContext";
import { MOCK_RESUME } from "@/lib/mock-resume";
import { normalizeResumeData, emptyResumeData } from "@/lib/resume-data";
import { toast } from "sonner";
import { generateImage, downloadImage } from "@/lib/pdf";

// Adapter to convert MOCK_RESUME (from lib/resume-schema) to the Resume interface (from types/index)
const INITIAL_RESUME: Resume = {
  id: MOCK_RESUME.id,
  userId: "local-user",
  title: "My Resume",
  template: MOCK_RESUME.metadata.templateId,
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Map to store resume data locally
const localResumeData = new Map<string, ResumeData>();
localResumeData.set(INITIAL_RESUME.id, normalizeResumeData(MOCK_RESUME.data as unknown as ResumeData));

export function ResumeProvider({ children }: { children: ReactNode }) {
  // Initialize with INITIAL_RESUME as the default state
  const [resumes, setResumes] = useState<Resume[]>([INITIAL_RESUME]);
  const [currentResume, setCurrentResume] = useState<Resume | null>(INITIAL_RESUME);
  const [resumeData, setResumeData] = useState<ResumeData>(localResumeData.get(INITIAL_RESUME.id)!);
  const [importedData, setImportedData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock implementation of createResume
  const createResume = useCallback(
    async (title: string, template: string, initialData?: ResumeData) => {
      const newResume: Resume = {
        ...INITIAL_RESUME,
        id: `local-${Date.now()}`,
        title,
        template,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const newData = normalizeResumeData(initialData || (MOCK_RESUME.data as unknown as ResumeData));
      localResumeData.set(newResume.id, newData);
      
      setResumes((prev) => [newResume, ...prev]);
      setCurrentResume(newResume);
      setResumeData(newData);
      return newResume;
    },
    []
  );

  // Mock implementation of loadResume - simply sets state from local array
  const loadResume = useCallback(
    async (resumeId: string) => {
      const found = resumes.find(r => r.id === resumeId);
      if (found) {
        setCurrentResume(found);
        // Load data from our local map
        const data = localResumeData.get(resumeId);
        if (data) {
          setResumeData(data);
        }
      }
    },
    [resumes]
  );

  const deleteResume = useCallback(
    async (id: string) => {
      setResumes((prev) => prev.filter((r) => r.id !== id));
      localResumeData.delete(id);
      if (currentResume?.id === id) {
        setCurrentResume(null);
        setResumeData(emptyResumeData);
      }
      toast.success("Resume deleted locally");
    },
    [currentResume?.id]
  );

  const selectResume = useCallback(
    (resume: Resume) => {
      setCurrentResume(resume);
      const data = localResumeData.get(resume.id);
      if (data) {
        setResumeData(data);
      }
    },
    []
  );

  const syncGuestData = useCallback(async () => {
    // No-op for NoDb version
  }, []);

  // Mock implementation of saveResume - effectively just confirms the current state
  const saveResume = useCallback(async () => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a file-based system, this would write to JSON file
    console.log("Saving Resume JSON:", JSON.stringify({
      ...currentResume,
      data: resumeData
    }, null, 2));
    
    toast.success("Resume saved locally (check console)");
    setIsLoading(false);
  }, [currentResume, resumeData]);

  const updateTemplate = useCallback((template: string) => {
    setCurrentResume((prev) => (prev ? { ...prev, template } : prev));
  }, []);

  const togglePublic = useCallback(async () => {
    setCurrentResume(prev => prev ? { ...prev, isPublic: !prev.isPublic } : prev);
    toast.info("Visibility toggled locally");
    return true;
  }, []);

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

  // AI Placeholders (disabled/mocked for no-db phase if backend is not ready)
  // But if the backend routes exist, we can keep them.
  // Assuming we want to minimize backend dependency for now:

  const rewriteBulletAI = useCallback(async (experienceId: string, bulletIndex: number) => {
    toast.info("AI features are disabled in this phase.");
  }, []);

  const generateSummaryAI = useCallback(async (targetRole?: string) => {
    toast.info("AI features are disabled in this phase.");
  }, []);

  const suggestSkillsAI = useCallback(async (jobTitle: string, description?: string) => {
    toast.info("AI features are disabled in this phase.");
    return { hardSkills: [], softSkills: [] };
  }, []);

  const suggestResponsibilitiesAI = useCallback(async (jobTitle: string, description?: string) => {
    toast.info("AI features are disabled in this phase.");
    return [];
  }, []);

  const suggestSummaryAI = useCallback(async (data: ResumeData, targetRole?: string) => {
    toast.info("AI features are disabled in this phase.");
    return "";
  }, []);

  // New PDF Generation using our HTML-to-PDF service
  const generatePDF = useCallback(async (templateId: string) => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/generate-pdf", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            data: resumeData,
            templateId: templateId || currentResume?.template || "modern",
            }),
        });

        if (!response.ok) throw new Error("Failed to generate PDF");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `resume-${templateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("PDF Downloaded!");
      } catch (error) {
        console.error(error);
        toast.error("Error generating PDF");
      } finally {
        setIsLoading(false);
      }
  }, [resumeData, currentResume]);

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
      generatePDF, 
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
      selectResume,
      saveResume,
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
      rewriteBulletAI,
      generateSummaryAI,
      suggestSummaryAI,
      suggestSkillsAI,
      suggestResponsibilitiesAI,
      generatePDF,
      setImportedData,
    ]
  );

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}
