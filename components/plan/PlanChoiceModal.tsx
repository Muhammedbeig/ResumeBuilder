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
        className="!left-0 !top-0 !translate-x-0 !translate-y-0 !h-screen !w-screen !max-w-none !rounded-none !border-0 overflow-y-auto bg-slate-950 text-white p-8 sm:p-10"
      >
        <div className="mx-auto w-full max-w-6xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-slate-300">{description}</DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Freemium</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                <Sparkles className="h-5 w-5 text-slate-200" />
              </div>
            </div>
            <h3 className="mt-5 text-2xl font-semibold text-white">Starter Access</h3>
            <p className="mt-2 text-sm text-slate-300">
              Perfect for quick edits and manual customization.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                Basic ATS-friendly templates
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                Manual editor & exports via app
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                Mobile app download access
              </li>
            </ul>

            <Button
              variant="outline"
              onClick={() => handleSelect("free")}
              className="mt-8 w-full border-slate-700 text-slate-100 hover:bg-slate-800"
            >
              Get Started Free
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Weekly</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                <Crown className="h-5 w-5 text-slate-200" />
              </div>
            </div>
            <h3 className="mt-5 text-2xl font-semibold text-white">Job Hunt Pass</h3>
            <p className="mt-2 text-sm text-slate-300">
              Short bursts for active job search weeks.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                All AI features unlocked
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                Premium templates & layouts
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                Watermark-free exports via app
              </li>
            </ul>

            <Button
              onClick={() => handleSelect("paid")}
              className="mt-8 w-full border border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800"
            >
              Start Weekly Pass
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-600/70 via-indigo-600/60 to-cyan-500/60 p-8 shadow-[0_25px_60px_rgba(76,29,149,0.35)]">
            <div className="absolute right-6 top-6 rounded-full bg-white/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
              Most Popular
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Monthly</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Crown className="h-5 w-5 text-white" />
              </div>
            </div>
            <h3 className="mt-5 text-2xl font-semibold text-white">Job Hunt Pass</h3>
            <p className="mt-2 text-sm text-white/85">
              Best value for consistent applications.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-white/90">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-white" />
                All AI features unlocked
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-white" />
                Premium templates & layouts
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-white" />
                Watermark-free exports via app
              </li>
            </ul>

            <Button
              onClick={() => handleSelect("paid")}
              className="mt-8 w-full bg-white text-slate-900 hover:bg-white/90"
            >
              Start Monthly Pass
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
