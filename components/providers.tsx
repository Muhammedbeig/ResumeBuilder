"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "@/lib/auth-client";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ResumeProvider } from "@/contexts/ResumeContext";
import { CVProvider } from "@/contexts/CVContext";
import { CoverLetterProvider } from "@/contexts/CoverLetterContext";
import { PlanChoiceProvider } from "@/contexts/PlanChoiceContext";
import {
  installApiFetchInterceptor,
  resolveAuthBasePath,
} from "@/lib/client-api";

installApiFetchInterceptor();

const AUTH_BASE_PATH = resolveAuthBasePath();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider basePath={AUTH_BASE_PATH}>
      <PlanChoiceProvider>
        <ThemeProvider>
          <ResumeProvider>
            <CVProvider>
              <CoverLetterProvider>{children}</CoverLetterProvider>
            </CVProvider>
          </ResumeProvider>
        </ThemeProvider>
      </PlanChoiceProvider>
    </SessionProvider>
  );
}
