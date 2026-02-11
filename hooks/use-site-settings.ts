"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/site-settings-shared";

const CACHE_TTL_MS = 60_000;

let cachedSettings: SiteSettings | null = null;
let cachedAt = 0;
let inflight: Promise<SiteSettings> | null = null;

async function fetchSiteSettings(): Promise<SiteSettings> {
  const now = Date.now();
  if (cachedSettings && now - cachedAt < CACHE_TTL_MS) {
    return cachedSettings;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/api/site/settings", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch site settings");
      const data = (await res.json()) as Partial<SiteSettings>;
      cachedSettings = { ...DEFAULT_SITE_SETTINGS, ...data };
      cachedAt = Date.now();
      return cachedSettings;
    } catch {
      cachedSettings = cachedSettings ?? DEFAULT_SITE_SETTINGS;
      cachedAt = Date.now();
      return cachedSettings;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(
    cachedSettings ?? DEFAULT_SITE_SETTINGS
  );
  const [loaded, setLoaded] = useState(Boolean(cachedSettings));

  useEffect(() => {
    let active = true;
    void (async () => {
      const next = await fetchSiteSettings();
      if (!active) return;
      setSettings(next);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { settings, loaded };
}
