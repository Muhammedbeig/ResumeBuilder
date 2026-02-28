"use client";

import { useEffect } from "react";
import { resolveApiUrl } from "@/lib/client-api";

function buildCurrentPath(): string {
  if (typeof window === "undefined") return "/rb/auth/callback/google";
  return `/rb/auth/callback/google${window.location.search}${window.location.hash}`;
}

function isSameLocation(target: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = new URL(window.location.href);
    const next = new URL(target, window.location.origin);
    return current.toString() === next.toString();
  } catch {
    return false;
  }
}

export default function GoogleCallbackBridgePage() {
  useEffect(() => {
    const lockKey = `rb_google_callback_redirect:${window.location.search}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(lockKey)) {
      return;
    }

    const currentPath = buildCurrentPath();
    const target = resolveApiUrl(currentPath);
    if (!target || isSameLocation(target)) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(lockKey, "1");
    }
    window.location.replace(target);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-56 rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="h-36 rounded-2xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-36 rounded-2xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-36 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="h-64 rounded-3xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </main>
  );
}
