"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlanChoice, type PlanChoice } from "@/contexts/PlanChoiceContext";
import { Check, ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

interface PlanChoiceModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  forceChoice?: boolean;
  title?: string;
  description?: string;
}

export function PlanChoiceModal({
  open,
  onOpenChange,
  forceChoice = false,
  title = "Choose the plan that fits your job search",
  description = "No payment required to start. Pick a plan to personalize your experience.",
}: PlanChoiceModalProps) {
  const { data: session } = useSession();
  const { setPlanChoice } = usePlanChoice();
  const hasSubscription =
    session?.user?.subscription === "pro" || session?.user?.subscription === "business";
  const plans = useMemo(
    () => [
      {
        id: "free",
        label: "Freemium",
        headline: "Starter Access",
        description: "Perfect for quick edits and manual customization.",
        priceLabel: null,
        features: [
          "All ATS-friendly templates",
          "Manual editor (no AI writing)",
          "Download as .txt or watermarked PDF",
          "All CV and cover letter templates",
        ],
        cta: "Choose Free Plan",
        paid: false,
      },
      {
        id: "weekly",
        label: "Weekly",
        headline: "Job Hunt Pass",
        description: "Short bursts for active job search weeks.",
        priceLabel: null,
        features: [
          "Full access to all 40+ templates",
          "Unlimited resume tailoring (Gemini 2.5 Flash)",
          "AI cover letter generator",
          "Auto-renews to monthly plan",
        ],
        cta: "Choose Weekly Plan",
        paid: true,
      },
      {
        id: "monthly",
        label: "Monthly",
        headline: "Active Seeker",
        description: "Best value for consistent applications.",
        priceLabel: null,
        features: [
          "Resume Roast (AI audit)",
          "Auto-Tailor from job URL",
          "LinkedIn Sync",
          "All Job Hunt Pass features",
        ],
        cta: "Choose Monthly Plan",
        paid: true,
      },
      {
        id: "annual",
        label: "Annual",
        headline: "Career Management",
        description: "Best for long-term career growth.",
        priceLabel: null,
        features: [
          "Priority access to Gemini 3 Pro",
          'Quarterly "Market Value" reports',
          "Unlimited versions and cloud storage",
          "All Pro Monthly features",
        ],
        cta: "Choose Annual Plan",
        paid: true,
      },
    ],
    []
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const activePlan = plans[activeIndex];

  useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    if (open && hasSubscription) {
      onOpenChange?.(false);
    }
  }, [open, hasSubscription, onOpenChange]);

  const handleSelect = (choice: PlanChoice) => {
    setPlanChoice(choice);
    onOpenChange?.(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (forceChoice && !nextOpen) return;
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!forceChoice}
        className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950/95 text-white shadow-2xl backdrop-blur-md p-6 sm:p-8 custom-scrollbar"
      >
        <div className="w-full">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-slate-300">{description}</DialogDescription>
          </DialogHeader>

          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {activePlan.label}
                </span>
                <span className="mt-2 text-2xl font-semibold text-white">{activePlan.headline}</span>
                <span className="mt-2 text-sm text-slate-300">{activePlan.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveIndex((idx) => Math.max(0, idx - 1))}
                  disabled={activeIndex === 0}
                  className="h-9 w-9 rounded-full border border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveIndex((idx) => Math.min(plans.length - 1, idx + 1))}
                  disabled={activeIndex === plans.length - 1}
                  className="h-9 w-9 rounded-full border border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {activePlan.paid ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
                  <Crown className="h-3.5 w-3.5" />
                  Paid Plan
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
                  Free Plan
                </span>
              )}
              {activePlan.priceLabel && (
                <span className="text-lg font-semibold text-white">{activePlan.priceLabel}</span>
              )}
            </div>

            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              {activePlan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSelect(activePlan.paid ? "paid" : "free")}
              className={`mt-6 w-full ${
                activePlan.paid
                  ? "bg-white text-slate-900 hover:bg-white/90"
                  : "border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800"
              }`}
              variant={activePlan.paid ? "default" : "outline"}
            >
              {activePlan.cta}
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            {plans.map((plan, idx) => (
              <span
                key={plan.id}
                className={`h-2 w-2 rounded-full ${
                  idx === activeIndex ? "bg-white" : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            No payment required right now. You can change your plan anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
