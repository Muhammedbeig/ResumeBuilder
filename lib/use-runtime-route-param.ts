"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getRouteParamFromPathname } from "@/lib/runtime-route-param";

function normalizeParam(value: string | null | undefined): string | null {
  if (!value || value === "_") return null;
  return value;
}

export function useRuntimeRouteParam(
  routePrefix: string,
  fallbackParam?: string | null,
) {
  const pathname = usePathname();
  const [mountedParam, setMountedParam] = useState<string | null>(null);

  useEffect(() => {
    // In static-export placeholder routes, Next may report "/.../_" for pathname.
    // Always resolve from the real browser location to preserve dynamic IDs/slugs.
    const browserPathname =
      typeof window !== "undefined" ? window.location.pathname : pathname;
    setMountedParam(
      normalizeParam(getRouteParamFromPathname(browserPathname, routePrefix)),
    );
  }, [pathname, routePrefix]);

  return useMemo(
    () => normalizeParam(mountedParam) ?? normalizeParam(fallbackParam),
    [mountedParam, fallbackParam],
  );
}
