"use client";

import { useState, useRef, useEffect, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Search, 
  Trophy, 
  Zap, 
  ArrowRight,
  Loader2,
  Briefcase,
  LayoutTemplate,
  Eye,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  PenTool,
  CheckCheck,
  File,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import type { ResumeData, TailoringResult } from "@/types";
import { resumeTemplates } from "@/lib/resume-templates";
import { fetchTemplates } from "@/lib/template-client";
import { normalizeResumeConfig } from "@/lib/panel-templates";
import { resolveResumeTemplateComponent } from "@/lib/template-resolvers";
import { ResumePreviewComponent } from "@/components/resume/ResumePreviewComponent";
import { useResume } from "@/contexts/ResumeContext";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { PlanChoiceModal } from "@/components/plan/PlanChoiceModal";

type TemplateOption = {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  component: ComponentType<{ data: ResumeData }>;
};

export default function AIResumeOptimizerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { createResume } = useResume();
  const { planChoice } = usePlanChoice();
  
  // State
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [templates, setTemplates] = useState<TemplateOption[]>(resumeTemplates);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isJobUrlLoading, setIsJobUrlLoading] = useState(false);
  const [inputType, setInputType] = useState<"paste" | "upload">("paste");
  const [isUploading, setIsUploading] = useState(false);
  const [isKeywordsExpanded, setIsKeywordsExpanded] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  
  // Analysis Results
  const [parsedResume, setParsedResume] = useState<ResumeData | null>(null);
  const [analysisResults, setAnalysisResults] = useState<TailoringResult | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  const loadingMessages = [
    "Reading your professional history...",
    "Decoding job requirements...",
    "Identifying critical keyword gaps...",
    "Aligning your skills with the role...",
    "Crafting achievement-focused improvements...",
    "Optimizing for ATS algorithms...",
    "Finalizing your tailored suggestions..."
  ];

  useEffect(() => {
    let isActive = true;

    const loadTemplates = async () => {
      const panelTemplates = await fetchTemplates("resume", { active: true });
      if (!panelTemplates.length || !isActive) return;

      const mapped: TemplateOption[] = panelTemplates.map((template) => {
        const config = normalizeResumeConfig(
          template.config as any,
          template.template_id
        );
        const component = resolveResumeTemplateComponent(
          template.template_id,
          config ?? undefined
        );

        return {
          id: template.template_id,
          name: template.name || config?.name || template.template_id,
          description: template.description || config?.description || "",
          premium: template.is_premium,
          component,
        };
      });

      if (isActive) setTemplates(mapped);
    };

    loadTemplates();
    return () => {
      isActive = false;
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const hasJobUrlAccess =
    session?.user?.subscription === "business" ||
    session?.user?.subscriptionPlanId === "monthly" ||
    session?.user?.subscriptionPlanId === "annual";

  const openPlanModal = () => setIsPlanModalOpen(true);

  useEffect(() => {
    if (planChoice) {
      setIsPlanModalOpen(false);
    }
  }, [planChoice]);

  // Rotate loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, loadingMessages.length]);

  const steps = [
    { number: 1, label: "Input", icon: FileText },
    { number: 2, label: "Analysis", icon: Search },
    { number: 3, label: "Template", icon: LayoutTemplate },
    { number: 4, label: "Preview", icon: Eye },
  ];

  const workflowSteps = [
    {
      title: "Input Your Details",
      description: "Paste your resume text or upload a PDF. Our AI will handle the parsing and extraction automatically.",
      icon: Upload,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
      title: "Deep Analysis",
      description: "Our AI compares your resume against the job description to identify keyword gaps and score your compatibility.",
      icon: Sparkles,
      color: "text-cyan-600",
      bg: "bg-cyan-100 dark:bg-cyan-900/30"
    },
    {
      title: "Choose a Template",
      description: "Select from our range of ATS-friendly templates that best suit your professional style and the job requirements.",
      icon: LayoutTemplate,
      color: "text-indigo-600",
      bg: "bg-indigo-100 dark:bg-indigo-900/30"
    },
    {
      title: "Live Preview",
      description: "Review your optimized resume in real-time. Fine-tune any details before downloading your job-winning document.",
      icon: Eye,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30"
    }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/extract-pdf-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to extract text");

      const data = await response.json();
      if (data.text) {
        setResumeText(data.text);
        setUploadedFileName(file.name);
        toast.success("Resume content extracted successfully");
      }
    } catch (error) {
      toast.error("Failed to read PDF. Please try pasting the text instead.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      toast.error("Please provide both your resume and the job description");
      return;
    }

    if (!session) {
      localStorage.setItem("optimizer_resume", resumeText);
      localStorage.setItem("optimizer_job", jobDescription);
      toast.info("Please sign in to optimize your resume", {
        action: {
          label: "Sign In",
          onClick: () => router.push("/login?callbackUrl=/ai-resume-optimizer"),
        },
      });
      router.push("/login?callbackUrl=/ai-resume-optimizer");
      return;
    }

    if (!planChoice || planChoice !== "paid") {
      toast.info("AI features are available in the Paid plan.");
      openPlanModal();
      return;
    }

    setIsAnalyzing(true);
    try {
        // Step 1: Parse Resume
        const parseRes = await fetch("/api/ai/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: resumeText }),
        });
        
        if (!parseRes.ok) {
            const errorData = await parseRes.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to parse resume");
        }
        
        const { data: parsedData } = await parseRes.json();
        
        // Ensure IDs exist for the tailor endpoint to reference and initialize ALL array fields
        const processedResume: ResumeData = {
            ...parsedData,
            experiences: parsedData.experiences?.map((exp: any) => ({ ...exp, id: exp.id || uuidv4() })) || [],
            education: parsedData.education?.map((edu: any) => ({ ...edu, id: edu.id || uuidv4() })) || [],
            skills: parsedData.skills?.map((skill: any) => ({ ...skill, id: skill.id || uuidv4() })) || [],
            projects: parsedData.projects?.map((proj: any) => ({ ...proj, id: proj.id || uuidv4() })) || [],
            certifications: parsedData.certifications?.map((cert: any) => ({ ...cert, id: cert.id || uuidv4() })) || [],
            languages: parsedData.languages?.map((lang: any) => ({ ...lang, id: lang.id || uuidv4() })) || [],
            basics: parsedData.basics || { 
                name: "", 
                email: "", 
                title: "", 
                phone: "", 
                location: "", 
                summary: "" 
            },
            structure: parsedData.structure || [],
            metadata: parsedData.metadata || { 
                themeColor: "#7c3aed", 
                fontFamily: "Inter", 
                fontSize: "md" 
            }
        } as ResumeData;

        setParsedResume(processedResume);

        // Step 2: Tailor Resume
        const tailorRes = await fetch("/api/ai/tailor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                resumeData: processedResume, 
                jobDescription 
            }),
        });

        if (!tailorRes.ok) {
             const errorData = await tailorRes.json().catch(() => ({}));
             throw new Error(errorData.error || "Failed to analyze match");
        }
        
        const results: TailoringResult = await tailorRes.json();
        
        setAnalysisResults(results);
        setStep(2);
        toast.success("Analysis complete!");
    } catch (error) {
        console.error(error);
        const msg = error instanceof Error ? error.message : "Analysis failed";
        toast.error(msg);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleFetchJobUrl = async () => {
    if (!jobUrl.trim()) {
      toast.error("Please enter a job URL");
      return;
    }

    if (!session) {
      toast.info("Please sign in to use Auto-Tailor from job URL", {
        action: {
          label: "Sign In",
          onClick: () => router.push("/login?callbackUrl=/ai-resume-optimizer"),
        },
      });
      router.push("/login?callbackUrl=/ai-resume-optimizer");
      return;
    }

    if (!hasJobUrlAccess) {
      toast.info("Auto-Tailor from job URL is available in Monthly and Annual plans.");
      return;
    }

    setIsJobUrlLoading(true);
    try {
      const response = await fetch("/api/ai/job-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });
      if (response.status === 402) {
        toast.info("Auto-Tailor from job URL is available in the Paid plan.");
        openPlanModal();
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch job description");
      }
      const data = await response.json();
      if (data?.text) {
        setJobDescription(data.text);
        toast.success("Job description extracted from URL");
      } else {
        throw new Error("No job description found");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to fetch job description";
      toast.error(msg);
    } finally {
      setIsJobUrlLoading(false);
    }
  };

  const handleApplySuggestion = (suggestionIndex: number) => {
    if (!parsedResume || !analysisResults) return;
    
    const suggestion = analysisResults.suggestions[suggestionIndex];
    if (!suggestion) return;

    const updatedExperiences = parsedResume.experiences.map(exp => {
        if (exp.id === suggestion.experienceId) {
            const newBullets = [...exp.bullets];
            if (newBullets[suggestion.bulletIndex]) {
                newBullets[suggestion.bulletIndex] = suggestion.suggested;
            }
            return { ...exp, bullets: newBullets };
        }
        return exp;
    });

    setParsedResume({ ...parsedResume, experiences: updatedExperiences });
    
    const updatedSuggestions = [...analysisResults.suggestions];
    updatedSuggestions.splice(suggestionIndex, 1);
    setAnalysisResults({ ...analysisResults, suggestions: updatedSuggestions });
    
    toast.success("Suggestion applied!");
  };

  const handleApplyAllSuggestions = () => {
    if (!parsedResume || !analysisResults || analysisResults.suggestions.length === 0) return;

    let updatedExperiences = [...parsedResume.experiences];

    analysisResults.suggestions.forEach(suggestion => {
        updatedExperiences = updatedExperiences.map(exp => {
            if (exp.id === suggestion.experienceId) {
                const newBullets = [...exp.bullets];
                if (newBullets[suggestion.bulletIndex] !== undefined) {
                    newBullets[suggestion.bulletIndex] = suggestion.suggested;
                }
                return { ...exp, bullets: newBullets };
            }
            return exp;
        });
    });

    setParsedResume({ ...parsedResume, experiences: updatedExperiences });
    setAnalysisResults({ ...analysisResults, suggestions: [] });
    toast.success("All suggestions applied successfully!");
  };

  const handleAddKeyword = (keyword: string) => {
    if (!analysisResults) return;

    const newMissing = analysisResults.missingKeywords.filter(k => k !== keyword);
    const newMatched = [keyword, ...analysisResults.matchedKeywords];
    
    setAnalysisResults({
        ...analysisResults,
        missingKeywords: newMissing,
        matchedKeywords: newMatched
    });
    
    // Add to resume skills section
    if (parsedResume) {
        const skillsIndex = parsedResume.skills.findIndex(s => s.name.toLowerCase().includes("skill") || s.name.toLowerCase().includes("technic"));
        let newSkills = [...parsedResume.skills];
        
        if (skillsIndex >= 0) {
            newSkills[skillsIndex] = {
                ...newSkills[skillsIndex],
                skills: [...newSkills[skillsIndex].skills, keyword]
            };
        } else {
            newSkills.push({
                id: uuidv4(),
                name: "Key Skills",
                skills: [keyword]
            });
        }
        setParsedResume({ ...parsedResume, skills: newSkills });
    }
    
    toast.success(`Keyword "${keyword}" added!`);
  };

  const handleProceedToTemplate = () => {
    if (parsedResume && analysisResults) {
      // Filter keywords logic: Only keep skills that are in the matched list
      const matchedLower = new Set(analysisResults.matchedKeywords.map(k => k.toLowerCase()));
      
      const tailoredSkills = parsedResume.skills.map(group => ({
        ...group,
        skills: group.skills.filter(s => {
            const skillLower = s.toLowerCase();
            return Array.from(matchedLower).some(k => 
                skillLower.includes(k) || k.includes(skillLower)
            );
        })
      })).filter(g => g.skills.length > 0);

      setParsedResume({ ...parsedResume, skills: tailoredSkills });
    }
    setStep(3);
  };

  const handleSaveAndEdit = async () => {
    if (!parsedResume) return;
    
    setIsSaving(true);
    try {
        const title = parsedResume.basics.title 
            ? `${parsedResume.basics.title} Resume` 
            : "Optimized Resume";
            
        const newResume = await createResume(title, selectedTemplate, parsedResume);
        
        toast.success("Resume saved successfully!");
        router.push(`/resume/${newResume.id}`);
    } catch (error) {
        console.error(error);
        toast.error("Failed to save resume. Please try again.");
        setIsSaving(false);
    }
  };

  const getPriorityBadge = (keywordCount: number) => {
    if (keywordCount >= 3) return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Critical Priority</Badge>;
    if (keywordCount >= 2) return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">High Priority</Badge>;
    if (keywordCount >= 1) return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">Medium Priority</Badge>;
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Low Priority</Badge>;
  };

  return (
    <>
      <PlanChoiceModal open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen} />
      <div ref={containerRef} className="relative min-h-screen pt-24 pb-20 overflow-hidden bg-gray-50 dark:bg-gray-950 flex flex-col">
      
      {/* Magical Loading Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 dark:bg-gray-950/90 backdrop-blur-md"
          >
            <div className="relative w-64 h-64 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-4 border-dashed border-purple-500/20 rounded-full" />
              <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-4 border-2 border-purple-500/30 rounded-full bg-purple-500/5" />
              <div className="relative">
                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-3xl shadow-2xl shadow-purple-500/40 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>
                {[...Array(6)].map((_, i) => (
                  <motion.div key={i} animate={{ rotate: 360, scale: [1, 1.5, 1] }} transition={{ rotate: { duration: 5 + i, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, delay: i * 0.3 } }} className="absolute top-1/2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full" style={{ margin: "-4px", transform: `rotate(${i * 60}deg) translateX(60px)` }} />
                ))}
              </div>
            </div>
            <div className="mt-12 text-center max-w-md px-6">
              <motion.h2 key={loadingMessageIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
                {loadingMessages[loadingMessageIndex]}
              </motion.h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm animate-pulse">Our AI is hard at work perfectioning your career path...</p>
              <div className="mt-8 w-64 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mx-auto">
                <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-full h-full bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 -z-10 pointer-events-none">
        <motion.div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute bottom-20 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" animate={{ x: [0, -40, 0], y: [0, -20, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      </div>

      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
              <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Optimization
              </Badge>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                Optimize Your Resume for <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">Any Job</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Upload your PDF resume or paste the text, along with the job description. Our AI will analyze both and suggest specific changes to help you beat ATS systems and land more interviews.
              </p>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex justify-center mb-16 overflow-x-auto py-4">
            <div className="flex items-center min-w-max px-4">
              {steps.map((s, i) => (
                <div key={s.number} className="flex items-center group">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 shadow-sm cursor-pointer
                    ${step === s.number 
                        ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white scale-110 shadow-purple-500/25" 
                        : step > s.number 
                            ? "bg-green-500 text-white" 
                            : "bg-white dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700"}
                  `}
                  onClick={() => {
                      if (step > s.number) setStep(s.number);
                  }}
                  >
                    {step > s.number ? <Check className="w-6 h-6" /> : <s.icon className="w-6 h-6" />}
                  </div>
                  <div className="ml-4 mr-4 hidden md:block">
                    <p className={`text-xs font-bold uppercase tracking-wider ${step === s.number ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}`}>Step {s.number}</p>
                    <p className={`text-sm font-bold ${step === s.number ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>{s.label}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 transition-colors duration-300 hidden md:block ${step > s.number ? "bg-green-500" : "bg-gray-200 dark:bg-gray-800"}`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Step 1: Input */}
          {step === 1 && (
            <div className="space-y-20">
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Resume Card */}
                    <Card className="p-6 border-2 border-transparent hover:border-purple-500/20 transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Your Resume</h3>
                            <p className="text-sm text-gray-500">Paste your resume text</p>
                        </div>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button onClick={() => setInputType("paste")} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${inputType === "paste" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"}`}>Paste</button>
                        <button onClick={() => setInputType("upload")} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${inputType === "upload" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"}`}>Upload PDF</button>
                        </div>
                    </div>
                    {inputType === "upload" && resumeText && !isUploading ? (
                        <div className="h-[300px] flex flex-col items-center justify-center p-8 bg-purple-50/50 dark:bg-purple-900/10 border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-xl group relative">
                            <button 
                                onClick={() => { setResumeText(""); setUploadedFileName(null); }}
                                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center mb-4">
                                <File className="w-8 h-8 text-purple-600" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                                    {uploadedFileName || "resume.pdf"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                                    File Attached
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="mt-6" onClick={() => document.getElementById('resume-upload')?.click()}>
                                Change File
                            </Button>
                            <input type="file" id="resume-upload" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
                        </div>
                    ) : inputType === "upload" ? (
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-900/50 h-[300px] flex flex-col items-center justify-center">
                        <input type="file" id="resume-upload" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
                        <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-4">
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                            {isUploading ? <Loader2 className="w-8 h-8 text-purple-600 animate-spin" /> : <Upload className="w-8 h-8 text-purple-600" />}
                            </div>
                            <div>
                            <span className="text-purple-600 font-medium hover:underline">Click to upload</span>
                            <span className="text-gray-500"> or drag and drop</span>
                            <p className="text-xs text-gray-400 mt-1">PDF only (max 5MB)</p>
                            </div>
                        </label>
                        </div>
                    ) : (
                        <Textarea placeholder="Paste your resume content here..." className="min-h-[300px] resize-none bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 focus:ring-purple-500" value={resumeText} onChange={(e) => setResumeText(e.target.value)} />
                    )}
                    <div className="mt-4 flex justify-between text-xs text-gray-400">
                        <span>
                            {inputType === "upload" && uploadedFileName 
                                ? "" 
                                : resumeText.length > 0 
                                    ? `${resumeText.length} chars` 
                                    : "No content yet"
                            }
                        </span>
                    </div>
                    </Card>

                    {/* Job Description Card */}
                    <Card className="p-6 border-2 border-transparent hover:border-purple-500/20 transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Job Description</h3>
                            <p className="text-sm text-gray-500">Paste the job you're applying for</p>
                        </div>
                        </div>
                    </div>
                    {hasJobUrlAccess && (
                    <div className="mb-4 space-y-3">
                        <Label htmlFor="job-url" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Auto-Tailor from Job URL
                        </Label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <div className="relative flex-1">
                            <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="job-url"
                              placeholder="Paste job URL (LinkedIn, Indeed, Google Jobs, etc.)"
                              className="pl-9"
                              value={jobUrl}
                              onChange={(e) => setJobUrl(e.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={handleFetchJobUrl}
                            disabled={isJobUrlLoading}
                            className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white"
                          >
                            {isJobUrlLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Fetching
                              </>
                            ) : (
                              "Fetch from URL"
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-400">
                          Works with most job boards. Paste any public job link to auto-extract the description.
                        </p>
                    </div>
                    )}
                    <Textarea placeholder="Paste the job description here..." className="min-h-[300px] resize-none bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 focus:ring-purple-500" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
                    <div className="mt-4 flex justify-between text-xs text-gray-400">
                        <span>{jobDescription.length > 0 ? `${jobDescription.length} chars` : "No content yet"}</span>
                    </div>
                    </Card>
                </div>

                <div className="text-center mb-24">
                    <Button size="lg" onClick={handleAnalyze} disabled={isAnalyzing || !resumeText || !jobDescription} className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white rounded-full px-12 py-6 text-lg font-bold shadow-xl shadow-purple-500/20 transition-all hover:scale-105">
                    {isAnalyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing...</> : <><Sparkles className="w-5 h-5 mr-2" /> Analyze & Get Suggestions</>}
                    </Button>
                    <p className="mt-4 text-xs text-gray-400">Your data is processed securely and never stored</p>
                </div>

                {/* Feature Highlights */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 py-16 border-t border-gray-200 dark:border-gray-800">
                    {[
                    { 
                        icon: CheckCircle2, 
                        color: "from-green-500 to-emerald-600", 
                        title: "Beat ATS Systems", 
                        description: "Over 75% of resumes are rejected by Applicant Tracking Systems. Our AI identifies missing keywords to help you pass." 
                    },
                    { 
                        icon: Search, 
                        color: "from-blue-500 to-cyan-600", 
                        title: "Keyword Optimization", 
                        description: "Each job posting contains specific keywords that hiring managers look for. Our AI extracts these and shows you where to add them." 
                    },
                    { 
                        icon: Trophy, 
                        color: "from-orange-500 to-amber-600", 
                        title: "Highlight Achievements", 
                        description: "Generic job descriptions don't impress recruiters. Our AI helps you transform responsibilities into quantifiable achievements." 
                    },
                    { 
                        icon: Zap, 
                        color: "from-yellow-500 to-orange-600", 
                        title: "Instant Results", 
                        description: "Get a comprehensive analysis in under a minute. See your ATS match score and actionable suggestions immediately." 
                    }
                    ].map((f, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative p-8 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
                    >
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${f.color} flex items-center justify-center mb-6 shadow-lg shadow-gray-200 dark:shadow-none transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                        <f.icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{f.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.description}</p>
                        <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </motion.div>
                    ))}
                </div>

                <div className="py-20 border-t border-gray-200 dark:border-gray-800">
                    <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How it Works</h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Optimize your resume in 4 simple steps and increase your interview chances.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {workflowSteps.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-8 rounded-3xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-center">
                        <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                            <s.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{s.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.description}</p>
                        </motion.div>
                    ))}
                    </div>
                </div>
            </div>
          )}

          {/* Step 2: Analysis */}
          {step === 2 && analysisResults && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    <Card className="p-8 flex flex-col items-center justify-center text-center space-y-4 border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                        <div className="relative w-40 h-40">
                             <svg className="w-full h-full transform -rotate-90">
                                <circle cx="50%" cy="50%" r="45%" className="stroke-gray-200 dark:stroke-gray-700 fill-none" strokeWidth="10" />
                                <circle cx="50%" cy="50%" r="45%" className={`fill-none transition-all duration-1000 ease-out ${analysisResults.matchScore >= 70 ? 'stroke-green-500' : analysisResults.matchScore >= 50 ? 'stroke-yellow-500' : 'stroke-red-500'}`} strokeWidth="10" strokeDasharray={`${analysisResults.matchScore * 2.83} 283`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">{analysisResults.matchScore}%</span>
                                <span className="text-xs text-gray-500 font-medium uppercase">Match Score</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Overall Compatibility</h3>
                            <p className="text-sm text-gray-500">Based on job requirements</p>
                        </div>
                    </Card>

                    <Card className="lg:col-span-2 border-0 shadow-lg bg-white dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-500" /> Missing Keywords
                            </CardTitle>
                            <CardDescription>
                                Consider adding these keywords to improve your match rate for relevant roles. Click a keyword to mark it as added.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                <div>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisResults.missingKeywords.length > 0 ? (
                                            <>
                                                {analysisResults.missingKeywords.slice(0, isKeywordsExpanded ? undefined : 10).map((kw, i) => (
                                                    <Badge 
                                                        key={i} 
                                                        variant="secondary"
                                                        onClick={() => handleAddKeyword(kw)}
                                                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 dark:hover:text-purple-100 transition-colors cursor-pointer px-3 py-1.5 text-sm font-normal group flex items-center gap-1"
                                                    >
                                                        {kw}
                                                        <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </Badge>
                                                ))}
                                                {analysisResults.missingKeywords.length > 10 && (
                                                    <Badge 
                                                        variant="outline"
                                                        onClick={() => setIsKeywordsExpanded(!isKeywordsExpanded)}
                                                        className="cursor-pointer border-purple-200 dark:border-purple-800 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-1.5"
                                                    >
                                                        {isKeywordsExpanded ? (
                                                            <><ChevronUp className="w-3 h-3 mr-1" /> Show Less</>
                                                        ) : (
                                                            <><ChevronDown className="w-3 h-3 mr-1" /> +{analysisResults.missingKeywords.length - 10} more</>
                                                        )}
                                                    </Badge>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-sm text-green-500 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                                                <Check className="w-4 h-4" /> All critical keywords found!
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2 border-t pt-6 dark:border-gray-700">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        Matched Keywords
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisResults.matchedKeywords.slice(0, 15).map((kw, i) => (
                                            <Badge key={i} variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800/50 px-3 py-1 text-sm font-normal">
                                                {kw}
                                            </Badge>
                                        ))}
                                        {analysisResults.matchedKeywords.length > 15 && (
                                            <span className="text-xs text-gray-400 self-center px-2">+{analysisResults.matchedKeywords.length - 15} more</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Zap className="w-6 h-6 text-yellow-500" />
                            AI Suggestions
                        </h3>
                        {analysisResults.suggestions.length > 0 && (
                            <Button onClick={handleApplyAllSuggestions} className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg">
                                <CheckCheck className="w-4 h-4 mr-2" /> Apply All Suggestions
                            </Button>
                        )}
                    </div>
                    
                    {analysisResults.suggestions.length > 0 ? (
                        <div className="grid gap-6">
                            {analysisResults.suggestions.map((suggestion, index) => (
                                <Card key={index} className="p-6 border-l-4 border-l-purple-500 shadow-md">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Original Bullet</h4>
                                                    {getPriorityBadge(suggestion.keywords.length)}
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-sm">{suggestion.original}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-2 flex items-center gap-2"><Sparkles className="w-3 h-3" /> AI Optimized</h4>
                                                <p className="text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 p-3 rounded-lg text-sm font-medium">{suggestion.suggested}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-center items-end gap-2 min-w-[140px]">
                                            <Button onClick={() => handleApplySuggestion(index)} size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white">Apply Change</Button>
                                            <Button variant="ghost" size="sm" className="w-full text-gray-400 hover:text-gray-600">Dismiss</Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Great Job!</h3>
                            <p className="text-gray-500">Your resume is already well-optimized for this job description.</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-8">
                     <Button variant="outline" size="lg" onClick={() => setStep(1)}>Back to Input</Button>
                    <Button size="lg" className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white shadow-lg" onClick={handleProceedToTemplate}>Next: Choose Template <ArrowRight className="ml-2 w-5 h-5" /></Button>
                </div>
            </motion.div>
          )}

          {/* Step 3: Template Selection */}
          {step === 3 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Choose a Template</h2>
                      <p className="text-gray-500 mt-2">Select a professional design for your optimized resume</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {templates.map((template) => (
                          <div 
                            key={template.id}
                            onClick={() => setSelectedTemplate(template.id)}
                            className={`
                                cursor-pointer group relative rounded-xl border-2 overflow-hidden transition-all duration-300
                                ${selectedTemplate === template.id 
                                    ? 'border-purple-600 ring-2 ring-purple-600 ring-offset-2 dark:ring-offset-gray-900' 
                                    : 'border-gray-200 dark:border-gray-800 hover:border-purple-400'}
                            `}
                          >
                              {/* Resume Preview Thumbnail - Refined to fit width and show only top */}
                              <div className="h-48 sm:h-56 bg-white dark:bg-gray-950 relative overflow-hidden border-b border-gray-100 dark:border-gray-800">
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top transform scale-[0.4] sm:scale-[0.45] lg:scale-[0.48] transition-transform duration-500 group-hover:scale-[0.5]">
                                      {parsedResume && (
                                          <ResumePreviewComponent 
                                              data={parsedResume} 
                                              templateId={template.id} 
                                              style={{ width: '816px', minHeight: '600px', boxShadow: 'none' }}
                                          />
                                      )}
                                  </div>
                                  
                                  {/* Gradient overlay to fade out the bottom */}
                                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white dark:from-gray-900 to-transparent z-10" />
                                  
                                  {/* Selection Overlay */}
                                  {selectedTemplate === template.id && (
                                      <div className="absolute inset-0 bg-purple-600/5 flex items-center justify-center z-20">
                                          <div className="bg-white dark:bg-gray-900 rounded-full p-2 shadow-xl border border-purple-100 dark:border-purple-900">
                                              <Check className="w-6 h-6 text-purple-600" />
                                          </div>
                                      </div>
                                  )}
                              </div>
                              
                              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                                  <div className="flex justify-between items-center mb-1">
                                      <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                                      {template.premium && (
                                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] px-1.5 py-0">Premium</Badge>
                                      )}
                                  </div>
                                  <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="flex justify-end gap-4 pt-8">
                      <Button variant="outline" size="lg" onClick={() => setStep(2)}>Back to Analysis</Button>
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white shadow-lg" 
                        onClick={() => setStep(4)}
                      >
                          Next: Preview <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                  </div>
              </motion.div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && parsedResume && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-200px)]">
                      {/* Left: Actions */}
                      <div className="lg:w-1/3 space-y-6">
                          <div>
                              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Final Review</h2>
                              <p className="text-gray-500">Review your tailored resume before saving.</p>
                          </div>

                          <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/20">
                              <CardContent className="p-6">
                                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                                      <Sparkles className="w-4 h-4" /> Optimization Success
                                  </h3>
                                  <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                                      <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Match Score: {analysisResults?.matchScore}%</li>
                                      <li className="flex items-center gap-2"><Check className="w-4 h-4" /> {analysisResults?.matchedKeywords.length} Keywords Optimized</li>
                                      <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Template: {templates.find(t => t.id === selectedTemplate)?.name}</li>
                                  </ul>
                              </CardContent>
                          </Card>

                          <div className="space-y-3">
                              <Button 
                                size="lg" 
                                className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white shadow-lg"
                                onClick={handleSaveAndEdit}
                                disabled={isSaving}
                              >
                                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <PenTool className="w-5 h-5 mr-2" />}
                                  Save & Customize in Editor
                              </Button>
                              <Button variant="outline" size="lg" className="w-full" onClick={() => setStep(3)}>
                                  Change Template
                              </Button>
                          </div>
                      </div>

                      {/* Right: Live Preview */}
                      <div className="lg:w-2/3 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden relative group">
                          <div className="absolute inset-0 overflow-auto p-8 flex justify-center">
                              <div className="scale-[0.6] sm:scale-[0.7] lg:scale-[0.8] origin-top transition-transform">
                                  <ResumePreviewComponent data={parsedResume} templateId={selectedTemplate} />
                              </div>
                          </div>
                          
                          {/* Hover overlay hint */}
                          <div className="absolute bottom-4 right-4 bg-black/75 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                              Scroll to view full resume
                          </div>
                      </div>
                  </div>
              </motion.div>
          )}

        </div>
      </div>
    </div>
    </>
  );
}
