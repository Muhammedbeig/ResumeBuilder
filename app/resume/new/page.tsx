"use client";

import { useEffect, useMemo, useRef, useState, Suspense, useCallback, type ComponentType } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Crown } from "lucide-react";
import { resumeTemplates } from "@/lib/resume-templates";
import { fetchTemplates } from "@/lib/template-client";
import { normalizeResumeConfig } from "@/lib/panel-templates";
import { resolveResumeTemplateComponent } from "@/lib/template-resolvers";
import { placeholderResumeData, previewResumeData } from "@/lib/resume-samples";
import { useResume } from "@/contexts/ResumeContext";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { PlanChoiceModal } from "@/components/plan/PlanChoiceModal";
import { toast } from "sonner";

type TemplateOption = {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  component: ComponentType<{ data: any }>;
};

function NewResumeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { createResume, importedData } = useResume();
  const { planChoice, isLoaded } = usePlanChoice();
  const [title, setTitle] = useState("Untitled Resume");
  const [templates, setTemplates] = useState<TemplateOption[]>(resumeTemplates);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const autoCreateRef = useRef<string | null>(null);
  
  const templateIdFromQuery = searchParams.get("template");
  const isAuthenticated = !!session?.user;

  useEffect(() => {
    if (importedData?.basics?.name) {
      setTitle(`${importedData.basics.name}'s Resume`);
    }
  }, [importedData]);

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

      if (isActive) {
        setTemplates(mapped);
      }
    };

    loadTemplates();

    return () => {
      isActive = false;
    };
  }, []);

  const hasSubscription = useMemo(
    () => session?.user?.subscription === "pro" || session?.user?.subscription === "business",
    [session?.user?.subscription]
  );
  const canUsePaid = useMemo(
    () => planChoice === "paid" || hasSubscription,
    [planChoice, hasSubscription]
  );

  useEffect(() => {
    if (planChoice) {
      setIsPlanModalOpen(false);
    }
  }, [planChoice]);

  const openPlanModal = useCallback(() => {
    if (!isAuthenticated) return;
    setIsPlanModalOpen(true);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!templateIdFromQuery) return;
    if (!isAuthenticated) return;
    if (!planChoice) {
      openPlanModal();
    }
  }, [templateIdFromQuery, isAuthenticated, planChoice, openPlanModal]);

  const ensurePlanChosen = useCallback(() => {
    if (!isAuthenticated) return true;
    if (!planChoice) {
      openPlanModal();
      return false;
    }
    return true;
  }, [isAuthenticated, planChoice, openPlanModal]);

  const handleSelectTemplate = useCallback(async (templateId: string, premium: boolean) => {
    if (!ensurePlanChosen()) return;
    if (premium && !canUsePaid) {
      if (!isAuthenticated) {
        toast.error("Please sign in to unlock premium templates");
        router.push(`/login?callbackUrl=${window.location.pathname}`);
        return;
      }
      toast.info("Premium templates are available in the Paid plan.");
      openPlanModal();
      return;
    }
    setCreatingTemplateId(templateId);
    try {
      const resume = await createResume(
        title.trim() || "Untitled Resume",
        templateId,
        importedData || placeholderResumeData
      );
      router.push(`/resume/${resume.id}`);
    } catch {
      toast.error("Failed to create resume");
    } finally {
      setCreatingTemplateId(null);
    }
  }, [canUsePaid, isAuthenticated, router, title, createResume, importedData, openPlanModal]);

  // Auto-select template if query param is present
  useEffect(() => {
    if (!templateIdFromQuery || !isLoaded || status === "loading") return;
    if (isAuthenticated && !planChoice) return;
    const template = templates.find((t) => t.id === templateIdFromQuery);
    if (!template || creatingTemplateId) return;
    if (autoCreateRef.current === templateIdFromQuery) return;
    autoCreateRef.current = templateIdFromQuery;
    handleSelectTemplate(template.id, template.premium);
  }, [templateIdFromQuery, isLoaded, status, creatingTemplateId, handleSelectTemplate, templates, isAuthenticated, planChoice]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <PlanChoiceModal open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose a Resume Template
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pick a template to start editing. Premium templates are marked with Pro.
          </p>
        </div>

        <div className="mb-8 max-w-xl">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Resume Title
          </label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Untitled Resume"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map((template) => {
            const Preview = template.component;
            const isLocked = template.premium && !canUsePaid;
            return (
              <Card key={template.id} className="overflow-hidden border-gray-200 dark:border-gray-800">
                <div className="relative bg-gray-50 dark:bg-gray-900/50 p-4">
                  <div className="absolute right-4 top-4 flex items-center gap-2">
                    {template.premium && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
                        <Crown className="h-3 w-3" />
                        Pro
                      </span>
                    )}
                  </div>
                  <div className="h-72 overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="origin-top-left scale-[0.4] w-[250%]">
                      <Preview data={previewResumeData} />
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.description}
                  </p>
                  <Button
                    className="w-full"
                    disabled={creatingTemplateId !== null || isLocked}
                    onClick={() => handleSelectTemplate(template.id, template.premium)}
                  >
                    {creatingTemplateId === template.id ? "Creating..." : "Use this template"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function NewResumePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <NewResumeContent />
    </Suspense>
  );
}
