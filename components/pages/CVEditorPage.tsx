"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  User,
  Code,
  Award,
  Save,
  Download,
  Image as ImageIcon,
  FileText,
  Plus,
  Trash2,
  Layout,
  MoreHorizontal,
  Share2,
  Copy,
  Globe,
  Check,
  Sparkles,
  CheckCircle2,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { buildResumeText, downloadTextFile } from "@/lib/resume-text";
import { createQrDataUrl } from "@/lib/qr";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
import { useCV } from "@/contexts/CVContext";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { cvTemplateMap } from "@/lib/cv-templates";
import { generatePDF } from "@/lib/pdf";
import {
  buildMonthYear,
  buildYearOptions,
  COMPANY_SUGGESTIONS,
  JOB_TITLE_SUGGESTIONS,
  MONTH_OPTIONS,
} from "@/lib/experience-suggestions";
import { GenericSectionManager } from "@/components/editor/GenericSectionManager";
import { DesignControls } from "@/components/editor/DesignControls";
import { RichTextarea } from "@/components/editor/RichTextarea";
import { FormattingToolbar } from "@/components/editor/FormattingToolbar";
import { CV_TEMPLATE_DEFAULT_FONTS } from "@/lib/template-defaults";
import { useElementSize } from "@/hooks/use-element-size";
import { PlanChoiceModal } from "@/components/plan/PlanChoiceModal";
import { DownloadGateModal } from "@/components/payments/DownloadGateModal";
import { toast } from "sonner";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { Experience, Education, Project, SkillGroup } from "@/types";

const AI_SUGGESTION_DELAY_MS = 1200;

export function CVEditorPage() {
  const router = useRouter();
  const params = useParams();
  const cvId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const { data: session, update: updateSession } = useSession();
  const { planChoice } = usePlanChoice();
  const [subscriptionOverride, setSubscriptionOverride] = useState(false);
  const [serverSubscription, setServerSubscription] = useState<string | null>(null);
  const [isSubscriptionActivating, setIsSubscriptionActivating] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);
  const hasSubscription = useMemo(
    () =>
      subscriptionOverride ||
      serverSubscription === "pro" ||
      serverSubscription === "business" ||
      session?.user?.subscription === "pro" ||
      session?.user?.subscription === "business",
    [subscriptionOverride, serverSubscription, session?.user?.subscription]
  );
  const canUsePaid = useMemo(
    () => planChoice === "paid" || hasSubscription,
    [planChoice, hasSubscription]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUnmountingRef = useRef(false);
  const {
    cvData,
    currentCV,
    updateBasics,
    updateMetadata,
    suggestSummaryAI,
    saveCV,
    loadCV,
    updateTemplate,
    updateStructure,
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
  } = useCV();

  const [activeTab, setActiveTab] = useState("basics");
  const [isExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [zoom, setZoom] = useState([90]);
  const [advancedFormatting, setAdvancedFormatting] = useState(false);
  const [draftExperience, setDraftExperience] = useState<Partial<Experience> | null>(null);
  const [draftSkillGroup, setDraftSkillGroup] = useState<Partial<SkillGroup> | null>(null);
  const [usedSummarySuggestions, setUsedSummarySuggestions] = useState<string[]>([]);
  const [summarySuggestions, setSummarySuggestions] = useState<string[]>([]);
  const summaryKeyRef = useRef("");
  const { ref: previewContainerRef, size: previewContainerSize } =
    useElementSize<HTMLDivElement>();
  const { ref: mobilePreviewRef, size: mobilePreviewSize } =
    useElementSize<HTMLDivElement>();

  const PAGE_WIDTH = 816;
  const PAGE_HEIGHT = 1056;

  const getPreviewScale = (availableWidth?: number) => {
    const zoomScale = zoom[0] / 100;
    return zoomScale;
  };

  const previewData = useMemo(() => {
    const nextExperiences = draftExperience
      ? [
          ...cvData.experiences,
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
      : cvData.experiences;

    const nextSkills = draftSkillGroup
      ? [
          ...cvData.skills,
          {
            id: "draft-skill-group",
            name: draftSkillGroup.name || "",
            skills: draftSkillGroup.skills || [],
          },
        ]
      : cvData.skills;

    if (!draftExperience && !draftSkillGroup) {
      return cvData;
    }

    return {
      ...cvData,
      experiences: nextExperiences,
      skills: nextSkills,
    };
  }, [cvData, draftExperience, draftSkillGroup]);

  const watermarkEnabled = useMemo(() => {
    if (!canUsePaid) return true;
    return cvData.metadata?.watermarkEnabled ?? false;
  }, [canUsePaid, cvData.metadata?.watermarkEnabled]);

  const availableSummarySuggestions = useMemo(() => {
    const used = new Set(usedSummarySuggestions.map((item) => item.toLowerCase()));
    return summarySuggestions.filter((suggestion) => !used.has(suggestion.toLowerCase()));
  }, [summarySuggestions, usedSummarySuggestions]);

  useEffect(() => {
    setUsedSummarySuggestions([]);
  }, [cvData.basics.title, previewData.experiences, previewData.skills]);

  useEffect(() => {
    if (planChoice) {
      setIsPlanModalOpen(false);
    }
  }, [planChoice]);

  useEffect(() => {
    const nextUserId = session?.user?.id ?? null;
    if (!nextUserId) return;
    if (lastUserIdRef.current && lastUserIdRef.current !== nextUserId) {
      setSubscriptionOverride(false);
      setServerSubscription(null);
    }
    lastUserIdRef.current = nextUserId;
  }, [session?.user?.id]);

  const syncSubscription = useCallback(async () => {
    try {
      const response = await fetchWithTimeout("/api/user/subscription", { cache: "no-store" }, 8000);
      if (!response.ok) return null;
      const data = await response.json();
      if (typeof data?.subscription === "string") {
        setServerSubscription(data.subscription);
      }
      if (updateSession) {
        void updateSession({
          subscription: data.subscription ?? "free",
          subscriptionPlanId: data.subscriptionPlanId ?? null,
        }).catch(() => undefined);
      }
      return data as { subscription?: string; subscriptionPlanId?: string | null };
    } catch {
      // ignore
    }
    return null;
  }, [updateSession]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const status = params.get("stripe");
    if (!status) return;

    const paymentTransactionId = params.get("payment_transaction_id");
    const checkoutSessionId = params.get("session_id");

    let cancelled = false;

    if (status === "success") {
      setIsDownloadModalOpen(true);
      toast.success("Payment successful.");

      void (async () => {
        setIsSubscriptionActivating(true);
        try {
          if (paymentTransactionId && checkoutSessionId) {
            await fetchWithTimeout("/api/stripe/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentTransactionId,
                sessionId: checkoutSessionId,
              }),
            }, 15000).catch(() => null);
          }

          const deadline = Date.now() + 30_000;
          while (!cancelled && Date.now() < deadline) {
            const latest = await syncSubscription();
            const ok =
              latest?.subscription === "pro" || latest?.subscription === "business";
            if (ok) {
              setSubscriptionOverride(true);
              return;
            }
            await new Promise((resolve) => setTimeout(resolve, 1200));
          }
        } finally {
          if (!isUnmountingRef.current) setIsSubscriptionActivating(false);
        }
      })();
    } else if (status === "cancel") {
      toast.info("Payment canceled.");
    }

    window.history.replaceState({}, "", window.location.pathname);

    return () => {
      cancelled = true;
    };
  }, [syncSubscription]);

  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (!isDownloadModalOpen) return;
    if (planChoice !== "paid" || hasSubscription) return;
    let cancelled = false;

    void (async () => {
      const latest = await syncSubscription();
      const ok = latest?.subscription === "pro" || latest?.subscription === "business";
      if (ok && !cancelled) {
        setSubscriptionOverride(true);
        setIsSubscriptionActivating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDownloadModalOpen, planChoice, hasSubscription, syncSubscription]);

  useEffect(() => {
    if (activeTab !== "basics") return;
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
      const suggestions = await suggestSummaryAI(
        previewData,
        previewData.basics.title || undefined
      );
      setSummarySuggestions(suggestions);
      summaryKeyRef.current = key;
    }, AI_SUGGESTION_DELAY_MS);
    return () => clearTimeout(timer);
  }, [previewData, suggestSummaryAI, activeTab]);


  useEffect(() => {
    if (cvId) {
      loadCV(cvId);
    }
  }, [cvId, loadCV]);

  const activeTemplateId = currentCV?.template || "academic-cv";
  const ActiveTemplate =
    cvTemplateMap[activeTemplateId as keyof typeof cvTemplateMap] ||
    cvTemplateMap["academic-cv"];
  const exportElementId = "cv-preview-export";

  const PreviewDocument = ({
    elementId,
    withScale = true,
    maxWidth,
  }: {
    elementId: string;
    withScale?: boolean;
    maxWidth?: number;
  }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(PAGE_HEIGHT);

    useEffect(() => {
      if (!withScale) return;
      const element = contentRef.current;
      if (!element) return;

      const updateHeight = () => {
        setContentHeight(element.scrollHeight || PAGE_HEIGHT);
      };

      updateHeight();
      const observer = new ResizeObserver(() => updateHeight());
      observer.observe(element);
      return () => observer.disconnect();
    }, [withScale]);

    const scale = withScale ? getPreviewScale(maxWidth) : 1;
    const scaledWidth = PAGE_WIDTH * scale;
    const scaledHeight = contentHeight * scale;

    return (
      <div
        className={withScale ? "overflow-hidden" : undefined}
        style={withScale ? { width: scaledWidth, height: scaledHeight } : undefined}
      >
        <div
          className={withScale ? "transition-transform duration-200" : undefined}
          style={
            withScale
              ? {
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: PAGE_WIDTH,
                }
              : undefined
          }
        >
          <div
            ref={contentRef}
            id={elementId}
            className="relative bg-white shadow-2xl min-h-[1056px] w-[816px] overflow-hidden"
          >
            <ActiveTemplate key={JSON.stringify(cvData.structure)} data={previewData} />
            {watermarkEnabled && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="select-none text-5xl font-bold uppercase tracking-[0.45em] text-white/25 mix-blend-soft-light rotate-[-25deg]">
                  ResuPro.com
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const buildShareUrl = () => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    if (currentCV?.shortId) return `${origin}/shared/${currentCV.shortId}`;
    if (currentCV?.id) return `${origin}/shared/${currentCV.id}`;
    return origin;
  };

  const openPlanModal = () => {
    if (!session?.user) return;
    setIsPlanModalOpen(true);
  };

  const handleWatermarkToggle = (nextValue: boolean) => {
    if (!canUsePaid && nextValue === false) {
      toast.info("Upgrade to remove the watermark.");
      openPlanModal();
      return;
    }
    updateMetadata({ watermarkEnabled: nextValue });
  };

  const ensurePlanChosen = () => {
    if (!session?.user) return true;
    if (!planChoice) {
      toast.info("Select a plan to continue.");
      openPlanModal();
      return false;
    }
    return true;
  };

  const openDownloadModal = async () => {
    if (!ensurePlanChosen()) return;
    if (planChoice === "paid" && !hasSubscription) {
      const latest = await syncSubscription();
      const latestHasSubscription =
        latest?.subscription === "pro" || latest?.subscription === "business";
      if (!latestHasSubscription) {
        router.push(
          `/pricing?flow=download&returnUrl=${encodeURIComponent(window.location.pathname)}`
        );
        return;
      }
      setSubscriptionOverride(true);
    }
    setIsDownloadModalOpen(true);
  };

  const exportPaidPDF = async () => {
    if (generatePDFContext) {
      await generatePDFContext(activeTemplateId);
      return;
    }
    const pdfUrl = await generatePDF(exportElementId, 'cv.pdf');
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'cv.pdf';
    link.click();
  };

  const exportFreePDF = async () => {
    const shareUrl = buildShareUrl();
    const qrDataUrl = shareUrl ? await createQrDataUrl(shareUrl, 160) : undefined;
    const footerText = shareUrl ? `View online: ${shareUrl}` : "Created with ResuPro";
    const pdfUrl = await generatePDF(exportElementId, 'cv.pdf', {
      watermarkText: "ResuPro.com",
      footerText,
      qrDataUrl,
      qrSizeMm: 18,
    });
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'cv.pdf';
    link.click();
  };

  const handleExportPDF = () => {
    void openDownloadModal();
  };

  const handleExportImage = () => {
    void openDownloadModal();
  };

  const handleExportTxt = () => {
    openDownloadModal();
  };

  const handleSave = async () => {
    if (!currentCV) return;
    
    if (!session?.user && currentCV.id.startsWith("local-")) {
        await saveCV();
        return;
    }

    if (!session?.user) {
      toast.error("Please sign in to save to cloud");
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }

    setIsSaving(true);
    try {
      await saveCV();
      toast.success("CV saved!");
    } catch (error) {
      toast.error("Failed to save CV");
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
    <>
      <PlanChoiceModal open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen} />
      <DownloadGateModal
        open={isDownloadModalOpen}
        onOpenChange={setIsDownloadModalOpen}
        planChoice={planChoice}
        hasSubscription={hasSubscription}
        isActivating={isSubscriptionActivating}
        resourceType="cv"
        resourceId={currentCV?.id ?? null}
      />
      <div
        className="relative overflow-hidden box-border"
        style={{
          paddingTop:
            "calc(var(--app-header-offset, var(--app-header-height)) + var(--app-header-gap, 0px))",
          height: "100vh",
        }}
      >
        <div className="flex h-full flex-col lg:flex-row overflow-hidden">
        {/* Editor Side (Left) */}
        <div className="w-full lg:w-1/2 lg:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
            <h2 className="font-semibold text-gray-900 dark:text-white">CV Editor</h2>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-none p-0">
                  <div className="h-full bg-gray-100 dark:bg-gray-950 overflow-y-auto overflow-x-auto">
                    <div
                      ref={mobilePreviewRef}
                      className="w-full flex flex-col p-4"
                    >
                      <div className="w-full max-w-[816px] mx-auto flex items-center justify-between mb-4 bg-white dark:bg-gray-900 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                        <span className="text-xs font-medium text-gray-500 px-2">Preview Zoom</span>
                        <div className="flex items-center gap-4 w-48 px-2">
                          <span className="text-xs text-gray-400 w-8">{zoom[0]}%</span>
                          <Slider value={zoom} onValueChange={setZoom} min={50} max={150} step={5} />
                        </div>
                      </div>
                      <div className="min-w-max w-full flex justify-center">
                        <PreviewDocument
                          elementId="cv-preview-mobile"
                          maxWidth={mobilePreviewSize.width}
                        />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Buttons */}
              <div className="hidden lg:flex items-center gap-2">
                <SharePopover />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWatermarkToggle(!watermarkEnabled)}
                  className={
                    !watermarkEnabled
                      ? "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800/60 dark:bg-purple-900/20 dark:text-purple-300"
                      : undefined
                  }
                >
                  Watermark {watermarkEnabled ? "On" : "Off"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportTxt} disabled={isExporting}>
                  <FileText className="w-4 h-4 mr-2" />
                  TXT
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

              {/* Mobile Buttons */}
              <div className="flex lg:hidden items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
                </Button>
                <Button size="sm" onClick={handleExportPDF} disabled={isExporting} className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white">
                  <Download className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4 mr-2" />
                      More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                      <SharePopover />
                    </div>
                    <DropdownMenuItem onClick={() => handleWatermarkToggle(!watermarkEnabled)}>
                      <CheckCircle2 className={`w-4 h-4 mr-2 ${!watermarkEnabled ? "text-purple-600" : "text-gray-400"}`} />
                      Watermark {watermarkEnabled ? "Off" : "On"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportTxt} disabled={isExporting}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export TXT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportImage} disabled={isExporting}>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Export Image
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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

                      <ScrollArea className="flex-1 min-h-0">
                        <div className="p-6 pb-6">
                          <TabsContent value="basics" className="mt-0 space-y-6">                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Basic Information
                    </h2>
                    
                    <div className="mb-6 flex items-center gap-6">
                      <div className="shrink-0">
                        {cvData.basics.image ? (
                          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={cvData.basics.image} 
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
                          {cvData.basics.image && (
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Full Name
                        </label>
                        <Input 
                          value={cvData.basics.name}
                          onChange={(e) => updateBasics({ name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Professional Title
                        </label>
                        <Input 
                          value={cvData.basics.title}
                          onChange={(e) => updateBasics({ title: e.target.value })}
                          placeholder="Software Engineer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <Input 
                          type="email"
                          value={cvData.basics.email}
                          onChange={(e) => updateBasics({ email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Phone
                        </label>
                        <Input 
                          value={cvData.basics.phone}
                          onChange={(e) => updateBasics({ phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Location
                      </label>
                      <Input 
                        value={cvData.basics.location}
                        onChange={(e) => updateBasics({ location: e.target.value })}
                        placeholder="San Francisco, CA"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          LinkedIn
                        </label>
                        <Input 
                          value={cvData.basics.linkedin || ''}
                          onChange={(e) => updateBasics({ linkedin: e.target.value })}
                          placeholder="linkedin.com/in/johndoe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          GitHub
                        </label>
                        <Input 
                          value={cvData.basics.github || ''}
                          onChange={(e) => updateBasics({ github: e.target.value })}
                          placeholder="github.com/johndoe"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Professional Summary
                        </label>
                      </div>
                      <RichTextarea
                        value={cvData.basics.summary}
                        onValueChange={(value) => updateBasics({ summary: value })}
                        placeholder="Write a brief summary about your professional background and career goals..."
                        rows={4}
                        enableFormatting
                      />
                      <div className="mt-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                            Summary Suggestions
                          </p>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            Updates automatically from your details
                          </span>
                        </div>
                        {!canUsePaid ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            AI features are available in the Paid plan.
                          </p>
                        ) : previewData.experiences.length === 0 ? (
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
                    <ExperienceSection
                      onDraftChange={setDraftExperience}
                      isActive={activeTab === "experience"}
                    />
                  </TabsContent>

                  <TabsContent value="education" className="mt-0">
                    <EducationSection />
                  </TabsContent>

                <TabsContent value="skills" className="mt-0">
                  <SkillsSection
                    onDraftChange={setDraftSkillGroup}
                    experienceSource={previewData.experiences}
                    isActive={activeTab === "skills"}
                  />
                </TabsContent>

                <TabsContent value="design" className="mt-0">
                  <DesignSection
                    templateId={activeTemplateId}
                    advancedFormatting={advancedFormatting}
                    onAdvancedFormattingChange={setAdvancedFormatting}
                    watermarkEnabled={watermarkEnabled}
                    onWatermarkToggle={handleWatermarkToggle}
                    watermarkLocked={!canUsePaid}
                  />
                </TabsContent>

                  <TabsContent value="projects" className="mt-0">
                    <ProjectsSection advancedFormatting={advancedFormatting} />
                  </TabsContent>

                  <TabsContent value="certifications" className="mt-0">
                    <CertificationsSection />
                  </TabsContent>

                  <TabsContent value="structure" className="mt-0">
                    <GenericSectionManager 
                        sections={cvData.structure || []} 
                        onUpdate={updateStructure} 
                    />
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Preview Side (Right) */}
        <div className="hidden lg:flex w-1/2 bg-gray-100 dark:bg-gray-950 flex-col">
          <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Preview</span>
            <div className="flex items-center gap-4 w-48">
              <span className="text-xs text-gray-400 w-8">{zoom[0]}%</span>
              <Slider value={zoom} onValueChange={setZoom} min={50} max={150} step={5} />
            </div>
          </div>
          <div className="flex-1 w-full overflow-y-auto overflow-x-auto p-8">
            <div ref={previewContainerRef} className="w-full">
              <div className="min-w-max w-full flex justify-center">
                <PreviewDocument
                  elementId="cv-preview-view"
                  maxWidth={previewContainerSize.width}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Offscreen preview for mobile export */}
        <div className="absolute -left-[9999px] top-0">
          <PreviewDocument elementId={exportElementId} withScale={false} />
        </div>
      </div>
    </div>
    </>
  );
}

// Subcomponents
function ExperienceSection({
  onDraftChange,
  isActive = true,
}: {
  onDraftChange?: (draft: Partial<Experience> | null) => void;
  isActive?: boolean;
}) {
  const {
    cvData,
    addExperience,
    updateExperience,
    removeExperience,
    suggestResponsibilitiesAI,
  } = useCV();
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
    const [isNewSuggestionsLoading, setIsNewSuggestionsLoading] = useState(false);
    const [editingExperiences, setEditingExperiences] = useState<Record<string, boolean>>({});
  const [existingSuggestionState, setExistingSuggestionState] = useState<
    Record<string, { role: string; used: string[] }>
  >({});
  const [existingAiSuggestions, setExistingAiSuggestions] = useState<Record<string, string[]>>({});
  const [existingAiKeys, setExistingAiKeys] = useState<Record<string, string>>({});
  const [existingSuggestionsLoading, setExistingSuggestionsLoading] = useState<Record<string, boolean>>({});
  const skipNextNewSuggestRef = useRef(false);
  const skipNextExistingSuggestRef = useRef<Record<string, boolean>>({});
  const activeBulletRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeBulletContext, setActiveBulletContext] = useState<{
    scope: "new" | "existing";
    expId?: string;
    index: number;
  } | null>(null);

  const applyToActiveBullet = (
    updater: (value: string, start: number, end: number) => {
      value: string;
      selectionStart?: number;
      selectionEnd?: number;
    }
  ) => {
    if (!activeBulletContext || !activeBulletRef.current) return;
    const input = activeBulletRef.current;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const result = updater(input.value, start, end);

    if (activeBulletContext.scope === "new") {
      const nextBullets = [...(newExperience.bullets || [])];
      nextBullets[activeBulletContext.index] = result.value;
      setNewExperience({ ...newExperience, bullets: nextBullets });
    } else if (activeBulletContext.scope === "existing" && activeBulletContext.expId) {
      const exp = cvData.experiences.find((item) => item.id === activeBulletContext.expId);
      if (!exp) return;
      const nextBullets = [...exp.bullets];
      nextBullets[activeBulletContext.index] = result.value;
      updateExperience(exp.id, { bullets: nextBullets });
    }

    requestAnimationFrame(() => {
      if (!activeBulletRef.current) return;
      activeBulletRef.current.focus();
      if (
        typeof result.selectionStart === "number" &&
        typeof result.selectionEnd === "number"
      ) {
        activeBulletRef.current.setSelectionRange(result.selectionStart, result.selectionEnd);
      }
    });
  };

  const wrapActiveSelection = (prefix: string, suffix: string) => {
    applyToActiveBullet((value, start, end) => {
      const before = value.slice(0, start);
      const selection = value.slice(start, end);
      const after = value.slice(end);
      const nextValue = `${before}${prefix}${selection}${suffix}${after}`;
      return {
        value: nextValue,
        selectionStart: start + prefix.length,
        selectionEnd: end + prefix.length,
      };
    });
  };

  const insertActiveBullets = () => {
    applyToActiveBullet((value, start, end) => {
      const before = value.slice(0, start);
      const selection = value.slice(start, end);
      const after = value.slice(end);
      const lines = selection ? selection.split(/\r?\n/) : [""];
      const updatedLines = lines.map((line) => {
        if (!line.trim()) return line;
        return line.startsWith("- ") || line.startsWith("* ") ? line : `- ${line}`;
      });
      const updated = updatedLines.join("\n");
      return {
        value: `${before}${updated}${after}`,
        selectionStart: start,
        selectionEnd: start + updated.length,
      };
    });
  };

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
      for (const exp of cvData.experiences) {
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
    skipNextExistingSuggestRef.current = {
      ...skipNextExistingSuggestRef.current,
      [exp.id]: true,
    };
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
      setIsNewSuggestionsLoading(false);
    }, [newExperience.role]);

    useEffect(() => {
      if (!isActive) {
        setIsNewSuggestionsLoading(false);
        return;
      }
      if (!isAdding || !newExperience.role) {
        setAiSuggestedBullets([]);
        setIsNewSuggestionsLoading(false);
        return;
      }
      if (skipNextNewSuggestRef.current) {
        skipNextNewSuggestRef.current = false;
        setIsNewSuggestionsLoading(false);
        return;
      }
      const description = (newExperience.bullets || []).join(" ").trim();
      const role = newExperience.role.trim();
      let isMounted = true;
      setIsNewSuggestionsLoading(true);
      const timer = setTimeout(async () => {
        try {
          const bullets = await suggestResponsibilitiesAI(role, description);
          if (!isMounted) return;
          setAiSuggestedBullets(bullets);
        } catch (error) {
          console.error("Auto-suggest failed", error);
        } finally {
          if (isMounted) setIsNewSuggestionsLoading(false);
        }
      }, AI_SUGGESTION_DELAY_MS);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }, [isActive, isAdding, newExperience.role, newExperience.bullets, suggestResponsibilitiesAI]);

    useEffect(() => {
      if (!isActive) return;
      const timers: NodeJS.Timeout[] = [];
      let isMounted = true;
      cvData.experiences.forEach((exp) => {
        if (!editingExperiences[exp.id] || !exp.role) {
          setExistingSuggestionsLoading((prev) => ({ ...prev, [exp.id]: false }));
          return;
        }
        if (skipNextExistingSuggestRef.current[exp.id]) {
          skipNextExistingSuggestRef.current = {
            ...skipNextExistingSuggestRef.current,
            [exp.id]: false,
          };
          setExistingSuggestionsLoading((prev) => ({ ...prev, [exp.id]: false }));
          return;
        }
        const description = exp.bullets.join(" ").trim();
        const key = `${exp.role}|${description}`;
        if (existingAiKeys[exp.id] === key) return;
        setExistingSuggestionsLoading((prev) => ({ ...prev, [exp.id]: true }));
        const timer = setTimeout(async () => {
          try {
            const bullets = await suggestResponsibilitiesAI(exp.role, description);
            if (!isMounted) return;
            setExistingAiSuggestions((prev) => ({ ...prev, [exp.id]: bullets }));
            setExistingAiKeys((prev) => ({ ...prev, [exp.id]: key }));
          } catch (error) {
            console.error("Auto-suggest existing failed", error);
          } finally {
            if (isMounted) {
              setExistingSuggestionsLoading((prev) => ({ ...prev, [exp.id]: false }));
            }
          }
        }, AI_SUGGESTION_DELAY_MS);
        timers.push(timer);
      });
      return () => {
        isMounted = false;
        timers.forEach(clearTimeout);
      };
    }, [isActive, editingExperiences, cvData.experiences, suggestResponsibilitiesAI, existingAiKeys]);

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
    skipNextNewSuggestRef.current = true;
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Work Experience
          </h2>
        </div>
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
                  className="h-12 text-sm"
                  contentClassName="rounded-2xl"
                  itemClassName="rounded-lg py-2"
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
                  className="h-12 text-sm"
                  contentClassName="rounded-2xl"
                  itemClassName="rounded-lg py-2"
                />
                </div>
              </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g. Dubai, UAE (Remote)"
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
                      {isNewSuggestionsLoading ? (
                        <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-300">
                          <Spinner className="h-3 w-3" />
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          <span>Summoning suggestions...</span>
                        </div>
                      ) : availableSuggestedBullets.length === 0 ? (
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
                  <FormattingToolbar
                    className="mb-1"
                    onBold={() => wrapActiveSelection("**", "**")}
                    onItalic={() => wrapActiveSelection("*", "*")}
                    onUnderline={() => wrapActiveSelection("__", "__")}
                    onList={insertActiveBullets}
                  />
                  <div className="space-y-3">
                    {newExperience.bullets && newExperience.bullets.length > 0 ? (
                      newExperience.bullets.map((bullet, idx) => (
                        <div key={idx} className="flex gap-2">
                          <div className="flex-1">
                            <RichTextarea
                              placeholder="Describe your achievement..."
                              value={bullet}
                              onValueChange={(value) => {
                                const nextBullets = [...(newExperience.bullets || [])];
                                nextBullets[idx] = value;
                                setNewExperience({ ...newExperience, bullets: nextBullets });
                              }}
                              onFocus={(event) => {
                                activeBulletRef.current = event.currentTarget;
                                setActiveBulletContext({ scope: "new", index: idx });
                              }}
                              rows={2}
                              className="w-full"
                            />
                          </div>
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

      {cvData.experiences.map((exp) => {
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
                      {(() => {
                        const suggestions = getExistingSuggestions(exp);
                        const isLoading = existingSuggestionsLoading[exp.id];

                        if (isLoading) {
                          return (
                            <div className="flex items-center justify-center gap-2 text-xs text-purple-600 dark:text-purple-300 py-4">
                              <Spinner className="h-3 w-3" />
                              <Sparkles className="h-3 w-3 animate-pulse" />
                              <span>Generating suggestions...</span>
                            </div>
                          );
                        }

                        if (suggestions.length === 0) {
                          return (
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                              {exp.role
                                ? "Suggestions will update as you edit the role."
                                : "Enter a job title to see suggestions."}
                            </p>
                          );
                        }

                        return suggestions.map((bullet, idx) => (
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
                        ));
                      })()}
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
                {exp.bullets.length > 0 && (
                  <FormattingToolbar
                    className="mb-1"
                    onBold={() => wrapActiveSelection("**", "**")}
                    onItalic={() => wrapActiveSelection("*", "*")}
                    onUnderline={() => wrapActiveSelection("__", "__")}
                    onList={insertActiveBullets}
                  />
                )}
                {exp.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="flex-1">
                      <RichTextarea
                        value={bullet}
                        onValueChange={(value) => {
                          const newBullets = [...exp.bullets];
                          newBullets[idx] = value;
                          updateExperience(exp.id, { bullets: newBullets });
                        }}
                        onFocus={(event) => {
                          activeBulletRef.current = event.currentTarget;
                          setActiveBulletContext({
                            scope: "existing",
                            expId: exp.id,
                            index: idx,
                          });
                        }}
                        placeholder="Describe your achievement..."
                        rows={2}
                        className="w-full"
                      />
                    </div>
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
  const { cvData, addEducation, updateEducation, removeEducation } = useCV();
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
            <Input
              placeholder="Institution Name"
              value={newEducation.institution}
              onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Degree (e.g., Bachelor's)"
                value={newEducation.degree}
                onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
              />
              <Input
                placeholder="Field of Study"
                value={newEducation.field}
                onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                placeholder="Start Year"
                value={newEducation.startDate}
                onChange={(e) => setNewEducation({ ...newEducation, startDate: e.target.value })}
              />
              <Input
                placeholder="End Year"
                value={newEducation.endDate}
                onChange={(e) => setNewEducation({ ...newEducation, endDate: e.target.value })}
              />
              <Input
                placeholder="GPA (optional)"
                value={newEducation.gpa}
                onChange={(e) => setNewEducation({ ...newEducation, gpa: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Education</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {cvData.education.map((edu) => (
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
  isActive = true,
}: {
  onDraftChange?: (draft: Partial<SkillGroup> | null) => void;
  experienceSource?: Experience[];
  isActive?: boolean;
}) {
  const { cvData, addSkillGroup, updateSkillGroup, removeSkillGroup, suggestSkillsAI } = useCV();
  const [isAdding, setIsAdding] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', skills: '' });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSkillSuggestionsLoading, setIsSkillSuggestionsLoading] = useState(false);
  const [editingSkillGroups, setEditingSkillGroups] = useState<Record<string, boolean>>({});
  const [skillDrafts, setSkillDrafts] = useState<Record<string, string>>({});
  const [existingSkillSuggestions, setExistingSkillSuggestions] = useState<Record<string, string[]>>({});
  const [existingSkillSuggestionsLoading, setExistingSkillSuggestionsLoading] = useState<Record<string, boolean>>({});
  const [existingSkillKeys, setExistingSkillKeys] = useState<Record<string, string>>({});
  const skipNextSkillSuggestRef = useRef(false);

  const experiencesForSuggestions = experienceSource || cvData.experiences;

  const parsedSkills = useMemo(
    () =>
      newGroup.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    [newGroup.skills]
  );

  const availableSuggestions = useMemo(() => {
    const existingLow = parsedSkills.map((skill) => skill.toLowerCase());
    const unique = aiSuggestions.filter(
      (skill, index, arr) =>
        arr.findIndex((item) => item.toLowerCase() === skill.toLowerCase()) === index
    );
    return unique
      .filter((skill) => {
        const sLow = skill.toLowerCase();
        return !existingLow.some((ext) => ext.includes(sLow) || sLow.includes(ext));
      })
      .slice(0, 24);
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
      cvData.skills.forEach((item) => {
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
    if (!isActive) {
      setIsSkillSuggestionsLoading(false);
      return;
    }
    if (!isAdding) {
      setAiSuggestions([]);
      setIsSkillSuggestionsLoading(false);
      return;
    }
    if (skipNextSkillSuggestRef.current) {
      skipNextSkillSuggestRef.current = false;
      setIsSkillSuggestionsLoading(false);
      return;
    }
    const experienceText = experiencesForSuggestions
      .map((exp) => `${exp.role} ${exp.company} ${exp.bullets?.join(" ") || ""}`)
      .join(" ")
      .trim();
    const context = [newGroup.name, newGroup.skills, experienceText].join(" ").trim();
    if (!cvData.basics.title && !context) {
      setAiSuggestions([]);
      setIsSkillSuggestionsLoading(false);
      return;
    }
    let isMounted = true;
    setIsSkillSuggestionsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await suggestSkillsAI(cvData.basics.title, context);
        if (!isMounted) return;
        const combined = [...(result.hardSkills || []), ...(result.softSkills || [])]
          .map((skill) => skill.trim())
          .filter(Boolean);
        const nextAi = combined.filter(
          (skill, index, arr) =>
            arr.findIndex((item) => item.toLowerCase() === skill.toLowerCase()) === index
        );
        setAiSuggestions(nextAi.slice(0, 24));
      } finally {
        if (isMounted) setIsSkillSuggestionsLoading(false);
      }
    }, AI_SUGGESTION_DELAY_MS);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isActive, isAdding, newGroup.name, newGroup.skills, cvData.basics.title, experiencesForSuggestions, suggestSkillsAI]);

  useEffect(() => {
    if (!isActive) return;
    const activeId = Object.keys(editingSkillGroups).find((id) => editingSkillGroups[id]);
    if (!activeId) return;
    const group = cvData.skills.find((item) => item.id === activeId);
    if (!group) return;
    const experienceText = experiencesForSuggestions
      .map((exp) => `${exp.role} ${exp.company} ${exp.bullets?.join(" ") || ""}`)
      .join(" ")
      .trim();
    const key = `${group.name}|${group.skills.join(",")}|${experienceText}`;
    if (existingSkillKeys[activeId] === key) return;
    setExistingSkillSuggestionsLoading((prev) => ({ ...prev, [activeId]: true }));
    const timer = setTimeout(async () => {
      try {
        const result = await suggestSkillsAI(
          cvData.basics.title,
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
      } finally {
        setExistingSkillSuggestionsLoading((prev) => ({ ...prev, [activeId]: false }));
      }
    }, AI_SUGGESTION_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isActive, editingSkillGroups, cvData.skills, cvData.basics.title, experiencesForSuggestions, suggestSkillsAI, existingSkillKeys]);

  const handleAddSkillSuggestion = (skill: string) => {
    const existing = new Set(parsedSkills.map((item) => item.toLowerCase()));
    if (existing.has(skill.toLowerCase())) return;
    const nextSkills = [...parsedSkills, skill];
    skipNextSkillSuggestRef.current = true;
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
            <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10 p-4">
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
              <div className="mt-3 flex flex-wrap gap-2">
                {isSkillSuggestionsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-300">
                    <Spinner className="h-3 w-3" />
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    <span>Generating skills...</span>
                  </div>
                ) : availableSuggestions.length === 0 ? (
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

      {cvData.skills.map((group) => (
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
                <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10 p-4">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Suggested Skills
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {existingSkillSuggestionsLoading[group.id] ? (
                      <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-300">
                        <Spinner className="h-3 w-3" />
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        <span>Generating skills...</span>
                      </div>
                    ) : (() => {
                      const currentSkills = (skillDrafts[group.id] ?? group.skills.join(", "))
                        .split(",")
                        .map((item) => item.trim().toLowerCase())
                        .filter(Boolean);
                      const filteredSuggestions = (existingSkillSuggestions[group.id] || []).filter(
                        (skill) => {
                          const sLow = skill.toLowerCase();
                          return !currentSkills.some((ext) => ext.includes(sLow) || sLow.includes(ext));
                        }
                      );
                      if (filteredSuggestions.length === 0) {
                        return (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Add details to see suggestions.
                          </p>
                        );
                      }
                      return filteredSuggestions.map((skill) => (
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
                      ));
                    })()}
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

function ProjectsSection({ advancedFormatting }: { advancedFormatting: boolean }) {
  const { cvData, addProject, updateProject, removeProject } = useCV();
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
            <RichTextarea
              placeholder="Project Description"
              value={newProject.description || ""}
              onValueChange={(value) => setNewProject({ ...newProject, description: value })}
              rows={3}
              enableFormatting={advancedFormatting}
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

      {cvData.projects.map((project) => (
        <Card key={project.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Input
                  value={project.name}
                  onChange={(e) => updateProject(project.id, { name: e.target.value })}
                  className="font-semibold mb-2"
                />
                <RichTextarea
                  value={project.description}
                  onValueChange={(value) => updateProject(project.id, { description: value })}
                  placeholder="Project description"
                  rows={3}
                  className="mb-4"
                  enableFormatting={advancedFormatting}
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
  const { cvData, addCertification, removeCertification } = useCV();
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
              <Input
                placeholder="Date Earned"
                value={newCert.date}
                onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
              />
              <Input
                placeholder="Certificate Link (optional)"
                value={newCert.link}
                onChange={(e) => setNewCert({ ...newCert, link: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Certification</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {cvData.certifications.map((cert) => (
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

function DesignSection({
  templateId,
  advancedFormatting,
  onAdvancedFormattingChange,
  watermarkEnabled,
  onWatermarkToggle,
  watermarkLocked,
}: {
  templateId: string;
  advancedFormatting: boolean;
  onAdvancedFormattingChange: (value: boolean) => void;
  watermarkEnabled: boolean;
  onWatermarkToggle: (value: boolean) => void;
  watermarkLocked: boolean;
}) {
  const { cvData, updateMetadata } = useCV();
  const defaultFont = CV_TEMPLATE_DEFAULT_FONTS[templateId] || "Inter";

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
        <DesignControls
          metadata={cvData.metadata}
          onUpdate={updateMetadata}
          defaultFontLabel={defaultFont}
          advancedFormattingEnabled={advancedFormatting}
          onAdvancedFormattingChange={onAdvancedFormattingChange}
          watermarkEnabled={watermarkEnabled}
          onWatermarkToggle={onWatermarkToggle}
          watermarkLocked={watermarkLocked}
        />
      </div>
    </motion.div>
  );
}

function SharePopover() {
  const { currentCV } = useCV();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!currentCV) return null;

  const url = typeof window !== "undefined" 
    ? `${window.location.origin}/shared/${currentCV.shortId || currentCV.id}`
    : "";

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
            <h4 className="font-medium leading-none">Share CV</h4>
          </div>
          <p className="text-sm text-gray-500">
            Anyone with the link can view this CV. No login required.
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

