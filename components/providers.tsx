"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ResumeProvider } from "@/contexts/ResumeContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ResumeProvider>{children}</ResumeProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
