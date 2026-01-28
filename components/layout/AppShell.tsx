"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { X } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Pages that should NOT show the landing page navigation
  const hideNavPaths = [
    "/dashboard",
    "/editor",
    "/templates",
    "/resume",
    "/cv",
    "/resume-preview",
    "/login",
    "/signup",
    "/ats-checker"
  ];

  const shouldHideNav = hideNavPaths.some(path => pathname?.startsWith(path));

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {!shouldHideNav ? (
        <Navigation />
      ) : (
        <Link 
          href="/"
          className="fixed top-4 right-6 z-50 p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-800 transition-colors shadow-sm"
          aria-label="Back to Home"
        >
          <X className="w-5 h-5" />
        </Link>
      )}
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
