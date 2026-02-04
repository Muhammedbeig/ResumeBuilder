"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Crown } from "lucide-react";
import { cvTemplates } from "@/lib/cv-templates";
import { placeholderResumeData, previewResumeData } from "@/lib/resume-samples";
import { useCV } from "@/contexts/CVContext";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { PlanChoiceModal } from "@/components/plan/PlanChoiceModal";
import { toast } from "sonner";

export default function NewCVPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { createCV, importedData } = useCV();
  const { planChoice, isLoaded } = usePlanChoice();
  const [title, setTitle] = useState("Untitled CV");
  const [isCreating, setIsCreating] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const isAuthenticated = !!session?.user;
  const forcePlanChoice = isAuthenticated && isLoaded && !planChoice;
  const shouldShowPlanModal = isAuthenticated && (forcePlanChoice || isPlanModalOpen);

  useEffect(() => {
    if (importedData?.basics?.name) {
      setTitle(`${importedData.basics.name}'s CV`);
    }
  }, [importedData]);

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

  const openPlanModal = () => {
    if (!isAuthenticated) return;
    setIsPlanModalOpen(true);
  };

  const handleSelectTemplate = async (templateId: string, premium: boolean) => {
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
    setIsCreating(true);
    try {
      const cv = await createCV(
        title.trim() || "Untitled CV",
        templateId,
        importedData || placeholderResumeData
      );
      toast.success("CV created successfully!");
      router.push(`/cv/${cv.id}`);
    } catch (error) {
      toast.error("Failed to create CV");
    } finally {
      setIsCreating(false);
    }
  };

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
        open={shouldShowPlanModal}
        onOpenChange={setIsPlanModalOpen}
        forceChoice={forcePlanChoice}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose a CV Template
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pick a template to start editing your Curriculum Vitae. Premium templates are marked with Pro.
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
          {cvTemplates.map((template) => {
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
                    disabled={isCreating || isLocked}
                    onClick={() => handleSelectTemplate(template.id, template.premium)}
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
