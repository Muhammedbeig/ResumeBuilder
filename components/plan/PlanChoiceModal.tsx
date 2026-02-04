"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlanChoice, type PlanChoice } from "@/contexts/PlanChoiceContext";
import { Check, Crown, Sparkles } from "lucide-react";

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
  const { setPlanChoice } = usePlanChoice();

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
        className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950/95 text-white shadow-2xl backdrop-blur-md p-6 sm:p-8 custom-scrollbar"
      >
        <div className="w-full">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-slate-300">{description}</DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex w-full gap-4 overflow-x-auto snap-x snap-mandatory flex-nowrap scrollbar-hide">
            <div className="flex-shrink-0 w-[85%] sm:w-[48%] lg:w-[31%] snap-start rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Freemium</p>
                <span className="text-lg font-semibold text-white">$0/mo</span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-white">Starter Access</h3>
              <p className="mt-2 text-sm text-slate-300">
                Perfect for quick edits and manual customization.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  Few basic ATS-friendly templates
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  Manual editor (no AI writing)
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  Download as .txt or watermarked PDF
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  Link of the website will be added
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  QR code on resume to open online
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  Basic cover letter templates
                </li>
              </ul>

              <Button
                variant="outline"
                onClick={() => handleSelect("free")}
                className="mt-auto w-full border-slate-700 text-slate-100 hover:bg-slate-800"
              >
                Get Started Free
              </Button>
            </div>

            <div className="flex-shrink-0 w-[85%] sm:w-[48%] lg:w-[31%] snap-start relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-600/70 to-cyan-500/70 p-6 sm:p-8 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-white/80">Weekly</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <Crown className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-white">Weekly</h3>
              <p className="mt-2 text-sm text-white/85">
                Short bursts for active job search weeks.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-white/90">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-white" />
                  Full access to all 40+ templates
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-white" />
                  Unlimited resume tailoring (Gemini 2.5 Flash)
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-white" />
                  AI cover letter generator
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-white" />
                  Auto-renews to monthly plan
                </li>
              </ul>

              <Button
                onClick={() => handleSelect("paid")}
                className="mt-auto w-full bg-white text-slate-900 hover:bg-white/90"
              >
                Start Weekly Pass
              </Button>
            </div>

            <div className="flex-shrink-0 w-[85%] sm:w-[48%] lg:w-[31%] snap-start rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Monthly</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                  <Crown className="h-5 w-5 text-slate-200" />
                </div>
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-white">Monthly</h3>
              <p className="mt-2 text-sm text-slate-300">
                Best value for consistent applications.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  Resume Roast (AI audit)
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  Auto-Tailor from job URL
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  LinkedIn Sync
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  All Job Hunt Pass features
                </li>
              </ul>

              <Button
                onClick={() => handleSelect("paid")}
                className="mt-auto w-full border border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800"
              >
                Start Monthly Pass
              </Button>
            </div>

            <div className="flex-shrink-0 w-[85%] sm:w-[48%] lg:w-[31%] snap-start rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Annual</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                  <Crown className="h-5 w-5 text-slate-200" />
                </div>
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-white">Annual</h3>
              <p className="mt-2 text-sm text-slate-300">
                Best for long-term career growth.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  Priority access to Gemini 3 Pro
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  Quarterly "Market Value" reports
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  Unlimited versions and cloud storage
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                  All Pro Monthly features
                </li>
              </ul>

              <Button
                onClick={() => handleSelect("paid")}
                className="mt-auto w-full border border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800"
              >
                Start Annual Pass
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            No payment required right now. You can change your plan anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
