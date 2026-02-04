"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ResumeProvider } from "@/contexts/ResumeContext";
import { CVProvider } from "@/contexts/CVContext";
import { CoverLetterProvider } from "@/contexts/CoverLetterContext";
import { PlanChoiceProvider } from "@/contexts/PlanChoiceContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PlanChoiceProvider>
        <ThemeProvider>
          <ResumeProvider>
            <CVProvider>
              <CoverLetterProvider>
                {children}
              </CoverLetterProvider>
            </CVProvider>
          </ResumeProvider>
        </ThemeProvider>
      </PlanChoiceProvider>
    </SessionProvider>
  );
}
