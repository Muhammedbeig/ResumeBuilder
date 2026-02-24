"use client";

import {
  useEffect,
  useMemo,
  useState,
  Suspense,
  useCallback,
  type ComponentType,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Crown } from "lucide-react";
import { cvTemplates } from "@/lib/cv-templates";
import { fetchTemplates } from "@/lib/template-client";
import { resolveCvTemplateComponent } from "@/lib/template-resolvers";
import type { CvTemplateConfig } from "@/lib/panel-templates";
import { placeholderResumeData, previewResumeData } from "@/lib/resume-samples";
import { useCV } from "@/contexts/CVContext";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { PlanChoiceModal } from "@/components/plan/PlanChoiceModal";
import { toast } from "sonner";
import { hasPaidAccess } from "@/lib/subscription";

type TemplateOption = {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  component: ComponentType<{ data: any }>;
};

function TemplateCardSkeleton() {
  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-800">
      <div className="relative bg-gray-50 p-4 dark:bg-gray-900/50">
        <div className="h-72 rounded-lg bg-gray-200 animate-pulse dark:bg-gray-800" />
      </div>
      <CardContent className="p-4">
        <div className="h-5 w-2/3 rounded bg-gray-200 animate-pulse dark:bg-gray-800" />
        <div className="mt-3 h-4 w-full rounded bg-gray-200 animate-pulse dark:bg-gray-800" />
        <div className="mt-2 h-4 w-3/4 rounded bg-gray-200 animate-pulse dark:bg-gray-800" />
        <div className="mt-5 h-10 w-full rounded-md bg-gray-200 animate-pulse dark:bg-gray-800" />
      </CardContent>
    </Card>
  );
}

function NewCVContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { createCV, importedData } = useCV();
  const { planChoice, isLoaded } = usePlanChoice();
  const [title, setTitle] = useState("Untitled CV");
  const [templates, setTemplates] = useState<TemplateOption[]>(() => [
    ...cvTemplates,
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  const templateIdFromQuery = searchParams.get("template");
  const isAuthenticated = !!session?.user;

  const redirectToLogin = useCallback(() => {
    const callbackUrl = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [router]);

  useEffect(() => {
    if (importedData?.basics?.name) {
      setTitle(`${importedData.basics.name}'s CV`);
    }
  }, [importedData]);

  useEffect(() => {
    let isActive = true;

    const loadTemplates = async () => {
      try {
        const panelTemplates = await fetchTemplates("cv", { active: true });
        if (!panelTemplates.length || !isActive) return;

        const mapped: TemplateOption[] = panelTemplates.map((template) => {
          const component = resolveCvTemplateComponent(
            template.template_id,
            template.config as CvTemplateConfig,
          );

          return {
            id: template.template_id,
            name: template.name || template.template_id,
            description: template.description || "",
            premium: template.is_premium,
            component,
          };
        });

        if (isActive) {
          setTemplates(mapped);
        }
      } finally {
        if (isActive) {
          setTemplatesLoading(false);
        }
      }
    };

    void loadTemplates();

    return () => {
      isActive = false;
    };
  }, []);

  const hasSubscription = useMemo(
    () =>
      hasPaidAccess(
        session?.user?.subscription,
        session?.user?.subscriptionPlanId,
      ),
    [session?.user?.subscription, session?.user?.subscriptionPlanId],
  );
  const canUsePaid = useMemo(
    () => planChoice === "paid" || hasSubscription,
    [planChoice, hasSubscription],
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
    if (!isAuthenticated) {
      toast.error("Please sign in to continue.");
      redirectToLogin();
      return false;
    }
    if (!planChoice) {
      openPlanModal();
      return false;
    }
    return true;
  }, [isAuthenticated, planChoice, openPlanModal, redirectToLogin]);

  const handleSelectTemplate = useCallback(
    async (templateId: string, premium: boolean) => {
      if (!ensurePlanChosen()) return;
      if (premium && !canUsePaid) {
        toast.info("Premium templates are available in the Paid plan.");
        openPlanModal();
        return;
      }
      setIsCreating(true);
      try {
        const cv = await createCV(
          title.trim() || "Untitled CV",
          templateId,
          importedData || placeholderResumeData,
        );
        toast.success("CV created successfully!");
        router.push(`/cv/${cv.id}`);
      } catch {
        toast.error("Failed to create CV");
      } finally {
        setIsCreating(false);
      }
    },
    [
      canUsePaid,
      isAuthenticated,
      router,
      title,
      createCV,
      importedData,
      openPlanModal,
    ],
  );

  // Auto-select template if query param is present
  useEffect(() => {
    if (templatesLoading) return;
    if (templateIdFromQuery && isLoaded && status !== "loading") {
      if (isAuthenticated && !planChoice) return;
      const template = templates.find((t) => t.id === templateIdFromQuery);
      if (template && !isCreating) {
        handleSelectTemplate(template.id, template.premium);
      }
    }
  }, [
    templateIdFromQuery,
    isLoaded,
    status,
    templatesLoading,
    isCreating,
    handleSelectTemplate,
    templates,
    isAuthenticated,
    planChoice,
  ]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <PlanChoiceModal
        open={isPlanModalOpen}
        onOpenChange={setIsPlanModalOpen}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose a CV Template
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pick a template to start editing your Curriculum Vitae. Premium
            templates are marked with Pro.
          </p>
        </div>

        <div className="mb-8 max-w-xl">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CV Title
          </label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Untitled CV"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {templatesLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <TemplateCardSkeleton key={`cv-template-skeleton-${index}`} />
              ))
            : templates.map((template) => {
                const Preview = template.component;
                const isLocked = template.premium && !canUsePaid;
                return (
                  <Card
                    key={template.id}
                    className="overflow-hidden border-gray-200 dark:border-gray-800"
                  >
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
                        disabled={isCreating || isLocked}
                        onClick={() =>
                          handleSelectTemplate(template.id, template.premium)
                        }
                      >
                        {isCreating ? "Creating..." : "Use this template"}
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

export default function NewCVPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <NewCVContent />
    </Suspense>
  );
}
