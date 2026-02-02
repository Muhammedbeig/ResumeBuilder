"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Save,
  Download,
  Image as ImageIcon,
  Plus,
  Trash2,
  Layout,
  MoreHorizontal,
  Palette,
  Share2,
  Copy,
  Globe,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResume } from "@/contexts/ResumeContext";
import { resumeTemplateMap, resumeTemplates } from "@/lib/resume-templates";
import { generateImage, generatePDF, downloadImage } from "@/lib/pdf";
import {
  buildMonthYear,
  buildYearOptions,
  COMPANY_SUGGESTIONS,
  JOB_TITLE_SUGGESTIONS,
  MONTH_OPTIONS,
} from "@/lib/experience-suggestions";
import { SectionManager } from "@/components/editor/SectionManager";
import { toast } from "sonner";
import type { Experience, Education, Project, SkillGroup } from "@/types";

export function ResumeEditorPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    resumeData,
    currentResume,
    updateBasics,
    suggestSummaryAI,
    saveResume,
    loadResume,
    updateTemplate,
    generatePDF: generatePDFContext,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addSkillGroup,
    updateSkillGroup,
    removeSkillGroup,
    addProject,
    updateProject,
    removeProject,
    addCertification,
    removeCertification
  } = useResume();

  const [activeTab, setActiveTab] = useState("basics");
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState([90]);
  const [draftExperience, setDraftExperience] = useState<Partial<Experience> | null>(null);
  const [draftSkillGroup, setDraftSkillGroup] = useState<Partial<SkillGroup> | null>(null);
  const [usedSummarySuggestions, setUsedSummarySuggestions] = useState<string[]>([]);
  const [summarySuggestions, setSummarySuggestions] = useState<string[]>([]);
  const summaryKeyRef = useRef("");

  const previewData = useMemo(() => {
    const nextExperiences = draftExperience
      ? [
          ...resumeData.experiences,
          {
            id: "draft-experience",
            company: draftExperience.company || "",
            role: draftExperience.role || "",
            location: draftExperience.location || "",
            startDate: draftExperience.startDate || "",
            endDate: draftExperience.endDate || "",
            current: draftExperience.current || false,
            bullets: draftExperience.bullets || [],
          },
        ]
      : resumeData.experiences;

    const nextSkills = draftSkillGroup
      ? [
          ...resumeData.skills,
          {
            id: "draft-skill-group",
            name: draftSkillGroup.name || "",
            skills: draftSkillGroup.skills || [],
          },
        ]
      : resumeData.skills;

    if (!draftExperience && !draftSkillGroup) {
      return resumeData;
    }

    return {
      ...resumeData,
      experiences: nextExperiences,
      skills: nextSkills,
    };
  }, [resumeData, draftExperience, draftSkillGroup]);

  const availableSummarySuggestions = useMemo(() => {
    const used = new Set(usedSummarySuggestions.map((item) => item.toLowerCase()));
    return summarySuggestions.filter((suggestion) => !used.has(suggestion.toLowerCase()));
  }, [summarySuggestions, usedSummarySuggestions]);

  useEffect(() => {
    setUsedSummarySuggestions([]);
  }, [resumeData.basics.title, previewData.experiences, previewData.skills]);

  useEffect(() => {
    if (previewData.experiences.length === 0) {
      setSummarySuggestions([]);
      summaryKeyRef.current = "";
      return;
    }
    const experienceText = previewData.experiences
      .map((exp) => `${exp.role} ${exp.company} ${exp.bullets?.join(" ") || ""}`)
      .join(" ")
      .trim();
    const skillsText = previewData.skills
      .flatMap((group) => group.skills)
      .join(" ")
      .trim();
    const key = `${previewData.basics.title}|${experienceText}|${skillsText}`;
    if (summaryKeyRef.current === key) return;
    const timer = setTimeout(async () => {
      const suggestion = await suggestSummaryAI(previewData, previewData.basics.title || undefined);
      setSummarySuggestions(suggestion ? [suggestion] : []);
      summaryKeyRef.current = key;
    }, 600);
    return () => clearTimeout(timer);
  }, [previewData, suggestSummaryAI]);

  useEffect(() => {
    if (resumeId) {
      loadResume(resumeId);
    }
  }, [resumeId, loadResume]);

  const activeTemplateId = currentResume?.template || "modern";
  const ActiveTemplate =
    resumeTemplateMap[activeTemplateId as keyof typeof resumeTemplateMap] ||
    resumeTemplateMap.modern;

  const handleExportPDF = async () => {
    if (!session?.user) {
      toast.error("Please sign in to export your resume");
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }
    setIsExporting(true);
    try {
      if (generatePDFContext) {
        await generatePDFContext(activeTemplateId);
      } else {
        const pdfUrl = await generatePDF('resume-preview', 'resume.pdf');
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'resume.pdf';
        link.click();
      }
      toast.success('Resume exported successfully!');
    } catch (error) {
      console.error('Export PDF failed:', error);
      toast.error('Failed to export resume');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    if (!session?.user) {
      toast.error("Please sign in to export your resume");
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }
    setIsExporting(true);
    try {
      const imageUrl = await generateImage('resume-preview');
      downloadImage(imageUrl, 'resume.png');
      toast.success('Resume exported successfully!');
    } catch (error) {
      console.error('Export Image failed:', error);
      toast.error('Failed to export resume');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    if (!currentResume) return;
    
    if (!session?.user && currentResume.id.startsWith("local-")) {
        await saveResume();
        return;
    }

    if (!session?.user) {
      toast.error("Please sign in to save your resume to the cloud");
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }

    setIsSaving(true);
    try {
      await saveResume();
      toast.success("Resume saved!");
    } catch (error) {
      toast.error("Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  };

  const mainTabs = [
    { id: 'basics', label: 'Basics' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
    { id: 'design', label: 'Design' },
  ];

  const moreTabs = [
    { id: 'projects', label: 'Projects', icon: Code },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'structure', label: 'Rearrange', icon: Layout },
  ];

  return (
    <div className="pt-24">
      <div className="flex h-[calc(100vh-96px)] overflow-hidden">
        {/* Editor Side (Left) */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
            <h2 className="font-semibold text-gray-900 dark:text-white">Editor</h2>
            <div className="flex items-center gap-2">
              <SharePopover />
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportImage} disabled={isExporting}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </Button>
              <Button size="sm" onClick={handleExportPDF} disabled={isExporting} className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white">
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
                  <TabsList className="flex-1 grid grid-cols-5">
                    {mainTabs.map(tab => (
                      <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm">
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0 h-9 w-9">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {moreTabs.map(tab => (
                        <DropdownMenuItem 
                          key={tab.id} 
                          onClick={() => setActiveTab(tab.id)}
                          className={activeTab === tab.id ? "bg-accent" : ""}
                        >
                          <tab.icon className="mr-2 h-4 w-4" />
                          {tab.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </div>

                      <ScrollArea className="flex-1 h-full">
                        <div className="p-6 pb-32">
                          <TabsContent value="basics" className="mt-0 space-y-6">                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Basic Information
                    </h2>
                    
                    <div className="mb-6 flex items-center gap-6">
                      <div className="shrink-0">
                        {resumeData.basics.image ? (
                          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={resumeData.basics.image} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="relative overflow-hidden"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              Upload Photo
                            </span>
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  updateBasics({ image: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                          {resumeData.basics.image && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => updateBasics({ image: '' })}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Recommended: Square JPG, PNG. Max 2MB.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input 
                          value={resumeData.basics.name}
                          onChange={(e) => updateBasics({ name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Professional Title</Label>
                        <Input 
                          value={resumeData.basics.title}
                          onChange={(e) => updateBasics({ title: e.target.value })}
                          placeholder="Software Engineer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Email</Label>
                        <Input 
                          type="email"
                          value={resumeData.basics.email}
                          onChange={(e) => updateBasics({ email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input 
                          value={resumeData.basics.phone}
                          onChange={(e) => updateBasics({ phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Location</Label>
                      <Input 
                        value={resumeData.basics.location}
                        onChange={(e) => updateBasics({ location: e.target.value })}
                        placeholder="San Francisco, CA"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>LinkedIn</Label>
                        <Input 
                          value={resumeData.basics.linkedin || ''}
                          onChange={(e) => updateBasics({ linkedin: e.target.value })}
                          placeholder="linkedin.com/in/johndoe"
                        />
                      </div>
                      <div>
                        <Label>GitHub</Label>
                        <Input 
                          value={resumeData.basics.github || ''}
                          onChange={(e) => updateBasics({ github: e.target.value })}
                          placeholder="github.com/johndoe"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Professional Summary</Label>
                      </div>
                      <Textarea 
                        value={resumeData.basics.summary}
                        onChange={(e) => updateBasics({ summary: e.target.value })}
                        placeholder="Write a brief summary about your professional background and career goals..."
                        rows={4}
                      />
                      <div className="mt-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                            Summary Suggestion
                          </p>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            Updates automatically from your details
                          </span>
                        </div>
                        {previewData.experiences.length === 0 ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Add at least one experience to see summary ideas.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {availableSummarySuggestions.length === 0 ? (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Suggestions are generating based on your latest edits.
                              </p>
                            ) : (
                              availableSummarySuggestions.map((suggestion, idx) => (
                              <div
                                key={`${suggestion}-${idx}`}
                                className="flex items-start gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2"
                              >
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  type="button"
                                  onClick={() => {
                                    updateBasics({ summary: suggestion });
                                    setUsedSummarySuggestions((prev) => [...prev, suggestion]);
                                  }}
                                  className="shrink-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
                                  {suggestion}
                                </p>
                              </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                </TabsContent>

                <TabsContent value="experience" className="mt-0">
                  <ExperienceSection onDraftChange={setDraftExperience} />
                </TabsContent>

                <TabsContent value="education" className="mt-0">
                  <EducationSection />
                </TabsContent>

                <TabsContent value="skills" className="mt-0">
                  <SkillsSection
                    onDraftChange={setDraftSkillGroup}
                    experienceSource={previewData.experiences}
                  />
                </TabsContent>

                <TabsContent value="design" className="mt-0">
                  <DesignSection />
                </TabsContent>

                <TabsContent value="projects" className="mt-0">
                  <ProjectsSection />
                </TabsContent>

                <TabsContent value="certifications" className="mt-0">
                  <CertificationsSection />
                </TabsContent>

                <TabsContent value="structure" className="mt-0">
                  <SectionManager />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Preview Side (Right) */}
        <div className="w-1/2 bg-gray-100 dark:bg-gray-950 p-8 overflow-auto flex flex-col items-center">
          <div className="w-full max-w-[816px] flex items-center justify-between mb-4 bg-white dark:bg-gray-900 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
              <span className="text-xs font-medium text-gray-500 px-2">Preview Zoom</span>
              <div className="flex items-center gap-4 w-48 px-2">
                  <span className="text-xs text-gray-400 w-8">{zoom[0]}%</span>
                  <Slider value={zoom} onValueChange={setZoom} min={50} max={150} step={5} />
              </div>
          </div>
          
          <div className="transition-transform duration-200" style={{ transform: `scale(${zoom[0] / 100})`, transformOrigin: "top center" }}>
            <div id="resume-preview" className="bg-white shadow-2xl min-h-[1056px] w-[816px] text-black">
                <ActiveTemplate 
                key={JSON.stringify(resumeData.structure)} 
                data={previewData} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents
function ExperienceSection({
  onDraftChange,
}: {
  onDraftChange?: (draft: Partial<Experience> | null) => void;
}) {
  const {
    resumeData,
    addExperience,
    updateExperience,
    removeExperience,
    suggestResponsibilitiesAI,
  } = useResume();
  const [isAdding, setIsAdding] = useState(false);
  const [newExperience, setNewExperience] = useState<Partial<Experience>>({
    company: '',
    role: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    bullets: []
  });
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [usedSuggestions, setUsedSuggestions] = useState<string[]>([]);
  const [aiSuggestedBullets, setAiSuggestedBullets] = useState<string[]>([]);
  const [editingExperiences, setEditingExperiences] = useState<Record<string, boolean>>({});
  const [existingSuggestionState, setExistingSuggestionState] = useState<
    Record<string, { role: string; used: string[] }>
  >({});
  const [existingAiSuggestions, setExistingAiSuggestions] = useState<Record<string, string[]>>({});
  const [existingAiKeys, setExistingAiKeys] = useState<Record<string, string>>({});

  const yearOptions = useMemo(
    () => buildYearOptions(1970, new Date().getFullYear() + 1),
    []
  );
  const jobTitleOptions = useMemo(
    () => JOB_TITLE_SUGGESTIONS.map((title) => ({ value: title })),
    []
  );
  const companyOptions = useMemo(
    () => COMPANY_SUGGESTIONS.map((company) => ({ value: company })),
    []
  );

  const normalizeSuggestion = (value: string) => value.trim().toLowerCase();
  const availableSuggestedBullets = useMemo(() => {
    const used = new Set(usedSuggestions.map(normalizeSuggestion));
    const unique = aiSuggestedBullets.filter(
      (bullet, index) =>
        aiSuggestedBullets.findIndex((item) => normalizeSuggestion(item) === normalizeSuggestion(bullet)) === index
    );
    return unique.filter((bullet) => !used.has(normalizeSuggestion(bullet)));
  }, [usedSuggestions, aiSuggestedBullets]);

  const toggleExperienceEdit = (id: string) => {
    setEditingExperiences((prev) => {
      const next: Record<string, boolean> = {};
      for (const exp of resumeData.experiences) {
        next[exp.id] = exp.id === id ? !prev[id] : false;
      }
      return next;
    });
  };

  const getExistingSuggestions = (exp: Experience) => {
    const unique = (existingAiSuggestions[exp.id] || []).filter(
      (item, index, arr) => arr.indexOf(item) === index
    );
    const state = existingSuggestionState[exp.id];
    const used = state && state.role === exp.role ? state.used : [];
    const usedSet = new Set(used.map(normalizeSuggestion));
    return unique.filter((bullet) => !usedSet.has(normalizeSuggestion(bullet)));
  };

  const applyExistingSuggestion = (exp: Experience, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const existing = exp.bullets.map((bullet) => bullet.trim().toLowerCase());
    if (existing.includes(trimmed.toLowerCase())) return;
    updateExperience(exp.id, { bullets: [...exp.bullets, trimmed] });
    setExistingSuggestionState((prev) => {
      const current = prev[exp.id];
      const nextUsed = current && current.role === exp.role ? current.used : [];
      return {
        ...prev,
        [exp.id]: { role: exp.role, used: [...nextUsed, trimmed] },
      };
    });
  };

  const handleAddExistingBullet = (exp: Experience) => {
    updateExperience(exp.id, { bullets: [...exp.bullets, ""] });
  };

  const handleRemoveExistingBullet = (exp: Experience, index: number) => {
    const nextBullets = exp.bullets.filter((_, idx) => idx !== index);
    updateExperience(exp.id, { bullets: nextBullets });
  };

  useEffect(() => {
    setUsedSuggestions([]);
    setAiSuggestedBullets([]);
  }, [newExperience.role]);

  useEffect(() => {
    if (!isAdding || !newExperience.role) {
      setAiSuggestedBullets([]);
      return;
    }
    const description = (newExperience.bullets || []).join(" ").trim();
    const role = newExperience.role.trim();
    const timer = setTimeout(async () => {
      try {
        const bullets = await suggestResponsibilitiesAI(role, description);
        setAiSuggestedBullets(bullets);
      } catch (error) {
        console.error("Auto-suggest failed", error);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isAdding, newExperience.role, newExperience.bullets, suggestResponsibilitiesAI]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    resumeData.experiences.forEach((exp) => {
      if (!editingExperiences[exp.id] || !exp.role) return;
      const description = exp.bullets.join(" ").trim();
      const key = `${exp.role}|${description}`;
      if (existingAiKeys[exp.id] === key) return;
      const timer = setTimeout(async () => {
        try {
          const bullets = await suggestResponsibilitiesAI(exp.role, description);
          setExistingAiSuggestions((prev) => ({ ...prev, [exp.id]: bullets }));
          setExistingAiKeys((prev) => ({ ...prev, [exp.id]: key }));
        } catch (error) {
          console.error("Auto-suggest existing failed", error);
        }
      }, 500);
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  }, [editingExperiences, resumeData.experiences, suggestResponsibilitiesAI, existingAiKeys]);

  useEffect(() => {
    if (!onDraftChange) return;
    if (!isAdding) {
      onDraftChange(null);
      return;
    }
    const cleanedBullets = (newExperience.bullets || [])
      .map((bullet) => bullet.trim())
      .filter(Boolean);
    const hasContent = Boolean(
      newExperience.company ||
        newExperience.role ||
        newExperience.location ||
        newExperience.startDate ||
        newExperience.endDate ||
        cleanedBullets.length > 0
    );
    if (!hasContent) {
      onDraftChange(null);
      return;
    }
    onDraftChange({
      ...newExperience,
      bullets: cleanedBullets,
    });
  }, [isAdding, newExperience, onDraftChange]);

  const handleAdd = () => {
    if (newExperience.company && newExperience.role) {
      const cleanedBullets = (newExperience.bullets || [])
        .map((bullet) => bullet.trim())
        .filter(Boolean);
      addExperience({
        ...(newExperience as Omit<Experience, "id">),
        bullets: cleanedBullets,
      });
      onDraftChange?.(null);
      setNewExperience({
        company: "",
        role: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: [],
      });
      setStartMonth("");
      setStartYear("");
      setEndMonth("");
      setEndYear("");
      setUsedSuggestions([]);
      setIsAdding(false);
    }
  };

  const handleAddBulletField = () => {
    setNewExperience((prev) => ({
      ...prev,
      bullets: [...(prev.bullets || []), ""],
    }));
  };

  const handleRemoveBullet = (index: number) => {
    setNewExperience((prev) => {
      const nextBullets = (prev.bullets || []).filter((_, idx) => idx !== index);
      return {
        ...prev,
        bullets: nextBullets,
      };
    });
  };

  const handleApplySuggestion = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setNewExperience((prev) => {
      const bullets = [...(prev.bullets || [])];
      if (bullets.some((bullet) => bullet.trim().toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      const emptyIndex = bullets.findIndex((bullet) => !bullet.trim());
      if (emptyIndex >= 0) {
        bullets[emptyIndex] = trimmed;
      } else {
        bullets.push(trimmed);
      }
      return { ...prev, bullets };
    });
    setUsedSuggestions((prev) => {
      const normalized = trimmed.toLowerCase();
      if (prev.some((item) => item.toLowerCase() === normalized)) {
        return prev;
      }
      return [...prev, trimmed];
    });
  };

  const handleStartMonthChange = (value: string) => {
    setStartMonth(value);
    setNewExperience((prev) => ({
      ...prev,
      startDate: buildMonthYear(value, startYear),
    }));
  };

  const handleStartYearChange = (value: string) => {
    setStartYear(value);
    setNewExperience((prev) => ({
      ...prev,
      startDate: buildMonthYear(startMonth, value),
    }));
  };

  const handleEndMonthChange = (value: string) => {
    setEndMonth(value);
    setNewExperience((prev) => ({
      ...prev,
      endDate: buildMonthYear(value, endYear),
    }));
  };

  const handleEndYearChange = (value: string) => {
    setEndYear(value);
    setNewExperience((prev) => ({
      ...prev,
      endDate: buildMonthYear(endMonth, value),
    }));
  };

  const handleCurrentChange = (checked: boolean) => {
    setNewExperience((prev) => ({
      ...prev,
      current: checked,
      endDate: checked ? "" : prev.endDate,
    }));
    if (checked) {
      setEndMonth("");
      setEndYear("");
    }
  };

  return (
    <motion.div
      key="experience"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Work Experience
        </h2>
        <Button 
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Experience
        </Button>
      </div>

      {isAdding && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Combobox
                  options={jobTitleOptions}
                  value={newExperience.role || ""}
                  onChange={(value) => setNewExperience({ ...newExperience, role: value })}
                  placeholder="Select or type a job title"
                  searchPlaceholder="Search job titles"
                  allowCustom
                  showOtherOption
                  otherLabel="Other (type your own)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Choose from common roles or type your own.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Combobox
                  options={companyOptions}
                  value={newExperience.company || ""}
                  onChange={(value) => setNewExperience({ ...newExperience, company: value })}
                  placeholder="Select or type a company"
                  searchPlaceholder="Search companies"
                  allowCustom
                  showOtherOption
                  otherLabel="Other (type your own)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Includes major Pakistani and global companies.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g. Lahore, Punjab, Pakistan (Remote)"
                value={newExperience.location}
                onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={startMonth || undefined} onValueChange={handleStartMonthChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={startYear || undefined} onValueChange={handleStartYearChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={endMonth || undefined}
                    onValueChange={handleEndMonthChange}
                    disabled={newExperience.current}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={endYear || undefined}
                    onValueChange={handleEndYearChange}
                    disabled={newExperience.current}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newExperience.current}
                onChange={(e) => handleCurrentChange(e.target.checked)}
                className="rounded"
              />
              <label className="text-sm text-gray-600 dark:text-gray-400">
                I currently work here
              </label>
            </div>

            <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Description Builder
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Suggestions update automatically based on the job title and description.
                    </p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6">
                <div className="space-y-4">
                  <div className="rounded-md border bg-white dark:bg-gray-900 p-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Recommended Points
                    </p>
                    <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                      {availableSuggestedBullets.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {newExperience.role
                            ? "Suggestions will appear as you add details."
                            : "Enter a job title to see suggestions."}
                        </p>
                      ) : (
                        availableSuggestedBullets.map((bullet, idx) => (
                          <div
                            key={`${bullet}-${idx}`}
                            className="flex items-start gap-2 rounded-md border border-gray-200 dark:border-gray-700 p-2"
                          >
                            <Button
                              variant="outline"
                              size="icon-sm"
                              type="button"
                              onClick={() => handleApplySuggestion(bullet)}
                              className="shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
                              {bullet}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Job description and achievements</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={handleAddBulletField}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Bullet
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {newExperience.bullets && newExperience.bullets.length > 0 ? (
                      newExperience.bullets.map((bullet, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Textarea
                            placeholder="Describe your achievement..."
                            value={bullet}
                            onChange={(e) => {
                              const nextBullets = [...(newExperience.bullets || [])];
                              nextBullets[idx] = e.target.value;
                              setNewExperience({ ...newExperience, bullets: nextBullets });
                            }}
                            rows={2}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => handleRemoveBullet(idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No bullets yet. Add one or choose a suggested point.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Experience</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  onDraftChange?.(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resumeData.experiences.map((exp) => {
        const isEditing = Boolean(editingExperiences[exp.id]);
        return (
          <Card key={exp.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{exp.role}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {exp.company} - {exp.location}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExperienceEdit(exp.id)}
                  >
                    {isEditing ? "Close" : "Edit"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(exp.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isEditing && (
                <div className="mb-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Job Title</Label>
                      <Input
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                        placeholder="Job Title"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                        placeholder="Company"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Location</Label>
                      <Input
                        value={exp.location}
                        onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                        placeholder="Location"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Start Date</Label>
                      <Input
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                        placeholder="Start Date"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>End Date</Label>
                      <Input
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                        placeholder="End Date"
                        disabled={exp.current}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) =>
                          updateExperience(exp.id, {
                            current: e.target.checked,
                            endDate: e.target.checked ? "" : exp.endDate,
                          })
                        }
                        className="rounded"
                      />
                      <Label className="text-sm text-gray-600 dark:text-gray-400">
                        I currently work here
                      </Label>
                    </div>
                  </div>

                  <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Recommended Points
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Suggestions update based on the job title above.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => handleAddExistingBullet(exp)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Bullet
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {getExistingSuggestions(exp).length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                          {exp.role
                            ? "Generating relevant suggestions..."
                            : "Enter a job title to see suggestions."}
                        </p>
                      ) : (
                        getExistingSuggestions(exp).map((bullet, idx) => (
                          <div
                            key={`${exp.id}-suggestion-${idx}`}
                            className="flex items-start gap-2 rounded-md border border-gray-200 dark:border-gray-700 p-2"
                          >
                            <Button
                              variant="outline"
                              size="icon-sm"
                              type="button"
                              onClick={() => applyExistingSuggestion(exp, bullet)}
                              className="shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
                              {bullet}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {isEditing && (
                  <div className="flex items-center justify-between">
                    <Label>Job description and achievements</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => handleAddExistingBullet(exp)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Bullet
                    </Button>
                  </div>
                )}
                {exp.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Textarea
                      value={bullet}
                      onChange={(e) => {
                        const newBullets = [...exp.bullets];
                        newBullets[idx] = e.target.value;
                        updateExperience(exp.id, { bullets: newBullets });
                      }}
                      placeholder="Describe your achievement..."
                      rows={2}
                      className="flex-1"
                    />
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => handleRemoveExistingBullet(exp, idx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </motion.div>
  );
}

function EducationSection() {
  const { resumeData, addEducation, updateEducation, removeEducation } = useResume();
  const [isAdding, setIsAdding] = useState(false);
  const [newEducation, setNewEducation] = useState<Partial<Education>>({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    gpa: ''
  });

  const handleAdd = () => {
    if (newEducation.institution && newEducation.degree) {
      addEducation(newEducation as Omit<Education, 'id'>);
      setNewEducation({
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: ''
      });
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      key="education"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Education
        </h2>
        <Button 
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Education
        </Button>
      </div>

      {isAdding && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input
                placeholder="Institution Name"
                value={newEducation.institution}
                onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Degree</Label>
                <Input
                  placeholder="e.g. Bachelor's"
                  value={newEducation.degree}
                  onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input
                  placeholder="e.g. Computer Science"
                  value={newEducation.field}
                  onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <MonthYearPicker
                  date={newEducation.startDate ? new Date(newEducation.startDate) : undefined}
                  onSelect={(date) => setNewEducation({ ...newEducation, startDate: format(date, "MMM yyyy") })}
                  placeholder="Start"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <MonthYearPicker
                  date={newEducation.endDate && newEducation.endDate !== 'Present' ? new Date(newEducation.endDate) : undefined}
                  onSelect={(date) => setNewEducation({ ...newEducation, endDate: format(date, "MMM yyyy") })}
                  placeholder="End"
                />
              </div>
              <div className="space-y-2">
                <Label>GPA (Optional)</Label>
                <Input
                  placeholder="3.8"
                  value={newEducation.gpa}
                  onChange={(e) => setNewEducation({ ...newEducation, gpa: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Education</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resumeData.education.map((edu) => (
        <Card key={edu.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Input
                  value={edu.institution}
                  onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                  className="font-semibold mb-2"
                />
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                    placeholder="Degree"
                  />
                  <Input
                    value={edu.field}
                    onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
                    placeholder="Field of Study"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    value={edu.startDate}
                    onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                    placeholder="Start Year"
                  />
                  <Input
                    value={edu.endDate}
                    onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                    placeholder="End Year"
                  />
                  <Input
                    value={edu.gpa || ''}
                    onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                    placeholder="GPA"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeEducation(edu.id)}
                className="text-red-600 hover:text-red-700 ml-4"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function SkillsSection({
  onDraftChange,
  experienceSource,
}: {
  onDraftChange?: (draft: Partial<SkillGroup> | null) => void;
  experienceSource?: Experience[];
}) {
  const { resumeData, addSkillGroup, updateSkillGroup, removeSkillGroup, suggestSkillsAI } = useResume();
  const [isAdding, setIsAdding] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', skills: '' });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [editingSkillGroups, setEditingSkillGroups] = useState<Record<string, boolean>>({});
  const [skillDrafts, setSkillDrafts] = useState<Record<string, string>>({});
  const [existingSkillSuggestions, setExistingSkillSuggestions] = useState<Record<string, string[]>>({});
  const [existingSkillKeys, setExistingSkillKeys] = useState<Record<string, string>>({});

  const experiencesForSuggestions = experienceSource || resumeData.experiences;

  const parsedSkills = useMemo(
    () =>
      newGroup.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    [newGroup.skills]
  );

  const availableSuggestions = useMemo(() => {
    const existing = new Set(parsedSkills.map((skill) => skill.toLowerCase()));
    const unique = aiSuggestions.filter(
      (skill, index, arr) =>
        arr.findIndex((item) => item.toLowerCase() === skill.toLowerCase()) === index
    );
    return unique.filter((skill) => !existing.has(skill.toLowerCase())).slice(0, 24);
  }, [aiSuggestions, parsedSkills]);

  useEffect(() => {
    if (!onDraftChange) return;
    if (!isAdding) {
      onDraftChange(null);
      return;
    }
    const skills = newGroup.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
    const name = newGroup.name.trim();
    if (!name && skills.length === 0) {
      onDraftChange(null);
      return;
    }
    onDraftChange({ name, skills });
  }, [isAdding, newGroup, onDraftChange]);

  const handleAdd = () => {
    if (newGroup.name && newGroup.skills) {
      addSkillGroup({
        name: newGroup.name,
        skills: newGroup.skills.split(',').map(s => s.trim()).filter(s => s)
      });
      onDraftChange?.(null);
      setNewGroup({ name: '', skills: '' });
      setAiSuggestions([]);
      setIsAdding(false);
    }
  };

  const startSkillEdit = (group: SkillGroup) => {
    setEditingSkillGroups(() => {
      const next: Record<string, boolean> = {};
      resumeData.skills.forEach((item) => {
        next[item.id] = item.id === group.id;
      });
      return next;
    });
    setSkillDrafts((prev) => ({ ...prev, [group.id]: group.skills.join(", ") }));
  };

  const cancelSkillEdit = (id: string) => {
    setEditingSkillGroups((prev) => ({ ...prev, [id]: false }));
    setSkillDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const saveSkillEdit = (id: string) => {
    const draft = (skillDrafts[id] || "").trim();
    const skills = draft
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    updateSkillGroup(id, { skills });
    setEditingSkillGroups((prev) => ({ ...prev, [id]: false }));
    setSkillDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  useEffect(() => {
    if (!isAdding) {
      setAiSuggestions([]);
      return;
    }
    const experienceText = experiencesForSuggestions
      .map((exp) => `${exp.role} ${exp.company} ${exp.bullets?.join(" ") || ""}`)
      .join(" ")
      .trim();
    const context = [newGroup.name, newGroup.skills, experienceText].join(" ").trim();
    if (!resumeData.basics.title && !context) {
      setAiSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const result = await suggestSkillsAI(resumeData.basics.title, context);
      const combined = [...(result.hardSkills || []), ...(result.softSkills || [])]
        .map((skill) => skill.trim())
        .filter(Boolean);
      const nextAi = combined.filter(
        (skill, index, arr) =>
          arr.findIndex((item) => item.toLowerCase() === skill.toLowerCase()) === index
      );
      setAiSuggestions(nextAi.slice(0, 24));
    }, 500);
    return () => clearTimeout(timer);
  }, [isAdding, newGroup.name, newGroup.skills, resumeData.basics.title, experiencesForSuggestions, suggestSkillsAI]);

  useEffect(() => {
    const activeId = Object.keys(editingSkillGroups).find((id) => editingSkillGroups[id]);
    if (!activeId) return;
    const group = resumeData.skills.find((item) => item.id === activeId);
    if (!group) return;
    const experienceText = experiencesForSuggestions
      .map((exp) => `${exp.role} ${exp.company} ${exp.bullets?.join(" ") || ""}`)
      .join(" ")
      .trim();
    const key = `${group.name}|${group.skills.join(",")}|${experienceText}`;
    if (existingSkillKeys[activeId] === key) return;
    const timer = setTimeout(async () => {
      const result = await suggestSkillsAI(
        resumeData.basics.title,
        `${group.name} ${group.skills.join(" ")} ${experienceText}`
      );
      const combined = [...(result.hardSkills || []), ...(result.softSkills || [])]
        .map((skill) => skill.trim())
        .filter(Boolean);
      const nextAi = combined.filter(
        (skill, index, arr) =>
          arr.findIndex((item) => item.toLowerCase() === skill.toLowerCase()) === index
      );
      setExistingSkillSuggestions((prev) => ({ ...prev, [activeId]: nextAi.slice(0, 24) }));
      setExistingSkillKeys((prev) => ({ ...prev, [activeId]: key }));
    }, 500);
    return () => clearTimeout(timer);
  }, [editingSkillGroups, resumeData.skills, resumeData.basics.title, experiencesForSuggestions, suggestSkillsAI, existingSkillKeys]);

  const handleAddSkillSuggestion = (skill: string) => {
    const existing = new Set(parsedSkills.map((item) => item.toLowerCase()));
    if (existing.has(skill.toLowerCase())) return;
    const nextSkills = [...parsedSkills, skill];
    setNewGroup((prev) => ({ ...prev, skills: nextSkills.join(", ") }));
  };

  return (
    <motion.div
      key="skills"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Skills
        </h2>
        <Button 
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Skill Group
        </Button>
      </div>

      {isAdding && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-6 space-y-4">
             <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Suggested Skills
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Suggestions update automatically. Click to add.
                  </p>
                </div>
             </div>
             <div className="flex flex-wrap gap-2">
                {availableSuggestions.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add details to see suggestions.
                  </p>
                ) : (
                  availableSuggestions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleAddSkillSuggestion(skill)}
                      className="rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 hover:border-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition"
                    >
                      {skill}
                    </button>
                  ))
                )}
             </div>
            <Input
              placeholder="Category Name (e.g., Programming Languages)"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            />
            <Textarea
              placeholder="Enter skills separated by commas (e.g., JavaScript, Python, React)"
              value={newGroup.skills}
              onChange={(e) => setNewGroup({ ...newGroup, skills: e.target.value })}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Skills</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  onDraftChange?.(null);
                  setAiSuggestions([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resumeData.skills.map((group) => (
        <Card key={group.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <Input
                value={group.name}
                onChange={(e) => updateSkillGroup(group.id, { name: e.target.value })}
                className="font-semibold max-w-xs"
                placeholder="Category Name"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    editingSkillGroups[group.id]
                      ? cancelSkillEdit(group.id)
                      : startSkillEdit(group)
                  }
                >
                  {editingSkillGroups[group.id] ? "Close" : "Edit Skills"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSkillGroup(group.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {editingSkillGroups[group.id] ? (
              <div className="space-y-3">
                <Textarea
                  value={skillDrafts[group.id] ?? group.skills.join(", ")}
                  onChange={(e) =>
                    setSkillDrafts((prev) => ({ ...prev, [group.id]: e.target.value }))
                  }
                  rows={3}
                  placeholder="Enter skills separated by commas"
                />
                <div className="rounded-md border bg-white dark:bg-gray-900 p-3">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Suggested Skills
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(existingSkillSuggestions[group.id] || []).length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Add details to see suggestions.
                      </p>
                    ) : (
                      (existingSkillSuggestions[group.id] || []).map((skill) => (
                        <button
                          key={`${group.id}-${skill}`}
                          type="button"
                          onClick={() => {
                            const current = (skillDrafts[group.id] ?? group.skills.join(", "))
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean);
                            if (current.some((item) => item.toLowerCase() === skill.toLowerCase())) {
                              return;
                            }
                            const next = [...current, skill].join(", ");
                            setSkillDrafts((prev) => ({ ...prev, [group.id]: next }));
                          }}
                          className="rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 hover:border-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition"
                        >
                          {skill}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveSkillEdit(group.id)}>Save</Button>
                  <Button variant="outline" onClick={() => cancelSkillEdit(group.id)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {group.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function ProjectsSection() {
  const { resumeData, addProject, updateProject, removeProject } = useResume();
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    technologies: [],
    link: '',
    github: ''
  });

  const handleAdd = () => {
    if (newProject.name) {
      addProject(newProject as Omit<Project, 'id'>);
      setNewProject({
        name: '',
        description: '',
        technologies: [],
        link: '',
        github: ''
      });
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      key="projects"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Projects
        </h2>
        <Button 
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Project
        </Button>
      </div>

      {isAdding && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            />
            <Textarea
              placeholder="Project Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              rows={3}
            />
            <Input
              placeholder="Technologies (comma separated)"
              value={newProject.technologies?.join(', ') || ''}
              onChange={(e) => setNewProject({ 
                ...newProject, 
                technologies: e.target.value.split(',').map(t => t.trim()).filter(t => t)
              })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Project Link"
                value={newProject.link || ''}
                onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
              />
              <Input
                placeholder="GitHub Link"
                value={newProject.github || ''}
                onChange={(e) => setNewProject({ ...newProject, github: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Project</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resumeData.projects.map((project) => (
        <Card key={project.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Input
                  value={project.name}
                  onChange={(e) => updateProject(project.id, { name: e.target.value })}
                  className="font-semibold mb-2"
                />
                <Textarea
                  value={project.description}
                  onChange={(e) => updateProject(project.id, { description: e.target.value })}
                  placeholder="Project description"
                  rows={3}
                  className="mb-4"
                />
                <Input
                  placeholder="Technologies (comma separated)"
                  value={project.technologies.join(', ')}
                  onChange={(e) => updateProject(project.id, { 
                    technologies: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  })}
                  className="mb-4"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Project Link"
                    value={project.link || ''}
                    onChange={(e) => updateProject(project.id, { link: e.target.value })}
                  />
                  <Input
                    placeholder="GitHub Link"
                    value={project.github || ''}
                    onChange={(e) => updateProject(project.id, { github: e.target.value })}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeProject(project.id)}
                className="text-red-600 hover:text-red-700 ml-4"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function CertificationsSection() {
  const { resumeData, addCertification, removeCertification } = useResume();
  const [isAdding, setIsAdding] = useState(false);
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '', link: '' });

  const handleAdd = () => {
    if (newCert.name && newCert.issuer) {
      addCertification(newCert);
      setNewCert({ name: '', issuer: '', date: '', link: '' });
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      key="certifications"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Certifications
        </h2>
        <Button 
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Certification
        </Button>
      </div>

      {isAdding && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Certification Name"
                value={newCert.name}
                onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
              />
              <Input
                placeholder="Issuing Organization"
                value={newCert.issuer}
                onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date Earned</Label>
                <MonthYearPicker
                  date={newCert.date ? new Date(newCert.date) : undefined}
                  onSelect={(date) => setNewCert({ ...newCert, date: format(date, "MMM yyyy") })}
                  placeholder="Date"
                />
              </div>
              <div className="space-y-2">
                 <Label>Link (Optional)</Label>
                 <Input
                    placeholder="Certificate Link"
                    value={newCert.link}
                    onChange={(e) => setNewCert({ ...newCert, link: e.target.value })}
                 />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Certification</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resumeData.certifications.map((cert) => (
        <Card key={cert.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Input
                  value={cert.name}
                  readOnly
                  className="font-semibold mb-2 bg-gray-50 dark:bg-gray-800"
                  placeholder="Certification Name"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    value={cert.issuer}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800"
                    placeholder="Issuing Organization"
                  />
                  <Input
                    value={cert.date}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800"
                    placeholder="Date Earned"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCertification(cert.id)}
                className="text-red-600 hover:text-red-700 ml-4"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function DesignSection() {
  const { resumeData, updateMetadata } = useResume();
  
  const colors = [
    "#000000", "#3b82f6", "#ef4444", "#10b981", "#8b5cf6", 
    "#f59e0b", "#ec4899", "#0ea5e9", "#6366f1", "#14b8a6",
  ];

  const fonts = [
    "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Raleway", 
    "Poppins", "Merriweather", "Playfair Display", "Ubuntu", "Nunito", 
    "Rubik", "Lora", "PT Sans", "PT Serif", "Quicksand", "Work Sans", 
    "Fira Sans", "Inconsolata", "Oswald"
  ];

  const fontSizes = [
    { id: "sm", label: "Small" },
    { id: "md", label: "Medium" },
    { id: "lg", label: "Large" },
  ];

  // Dynamically load font
  useEffect(() => {
    const font = resumeData.metadata?.fontFamily || "Inter";
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@300;400;500;700&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [resumeData.metadata?.fontFamily]);

  return (
    <motion.div
      key="design"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Design & Appearance
        </h2>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium text-gray-900 dark:text-white">Accent Color</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateMetadata({ themeColor: color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      resumeData.metadata?.themeColor === color 
                        ? "border-gray-900 dark:border-white scale-110" 
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
                <div className="relative">
                    <input 
                        type="color" 
                        value={resumeData.metadata?.themeColor || "#000000"}
                        onChange={(e) => updateMetadata({ themeColor: e.target.value })}
                        className="w-8 h-8 rounded-full overflow-hidden cursor-pointer opacity-0 absolute inset-0"
                    />
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center pointer-events-none">
                        <span className="text-xs">+</span>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
               <div className="flex items-center gap-2 mb-4">
                 <h3 className="font-medium text-gray-900 dark:text-white">Font Size</h3>
               </div>
               <div className="flex gap-2">
                 {fontSizes.map((size) => (
                    <Button
                        key={size.id}
                        variant={resumeData.metadata?.fontSize === size.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateMetadata({ fontSize: size.id })}
                        className="flex-1"
                    >
                        {size.label}
                    </Button>
                 ))}
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Font Family</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {fonts.map((font) => (
                  <div
                    key={font}
                    onClick={() => updateMetadata({ fontFamily: font })}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      resumeData.metadata?.fontFamily === font
                        ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-600"
                        : "border-gray-200 dark:border-gray-800 hover:border-purple-300"
                    }`}
                  >
                    <div className="font-medium text-sm" style={{ fontFamily: font }}>{font}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function SharePopover() {
  const { currentResume } = useResume();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!currentResume) return null;

  const url = typeof window !== 'undefined' 
    ? `${window.location.origin}/shared/${currentResume.id}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Share Resume</h4>
          </div>
          <p className="text-sm text-gray-500">
            Anyone with the link can view this resume. No login required.
          </p>

          <div className="flex items-center space-x-2">
            <Input value={url} readOnly className="h-8 text-xs" />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
