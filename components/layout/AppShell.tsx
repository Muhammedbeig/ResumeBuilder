"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Toaster } from "sonner";
import { Navigation } from "@/components/layout/Navigation";
import { SeoManager } from "@/components/layout/SeoManager";
import { PlanChoiceModal } from "@/components/plan/PlanChoiceModal";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const { planChoice, isLoaded } = usePlanChoice();

  const shouldShowPlanModal = useMemo(() => {
    if (status !== "authenticated") return false;
    if (!isLoaded || planChoice) return false;
    if (!pathname) return true;
    return !pathname.startsWith("/login") && !pathname.startsWith("/signup");
  }, [status, isLoaded, planChoice, pathname]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <SeoManager />
      <Navigation />
      <PlanChoiceModal open={shouldShowPlanModal} forceChoice />
      {children}
      <Toaster
        position="top-right"
        richColors
        theme="light"
        toastOptions={{
          style: {
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
          },
        }}
      />
    </div>
  );
}
