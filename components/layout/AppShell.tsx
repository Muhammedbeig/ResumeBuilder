"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { Navigation } from "@/components/layout/Navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Navigation />
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
