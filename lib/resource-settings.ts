import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { envBool, envInt } from "@/lib/env";

const CACHE_TTL_MS = 60_000;

const SETTINGS_KEYS = [
  "PUPPETEER_ENABLED",
  "PUPPETEER_CONCURRENCY",
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_PUPPETEER",
  "RATE_LIMIT_AI",
  "RATE_LIMIT_AI_HEAVY",
  "RATE_LIMIT_PDF",
  "AI_TEXT_LIMIT",
  "PDF_TEXT_LIMIT",
  "puppeteer_enabled",
  "puppeteer_concurrency",
  "rate_limit_window_ms",
  "rate_limit_puppeteer",
  "rate_limit_ai",
  "rate_limit_ai_heavy",
  "rate_limit_pdf",
  "ai_text_limit",
  "pdf_text_limit",
] as const;

export type ResourceSettings = {
  puppeteer: {
    enabled: boolean;
    concurrency: number;
  };
  rateLimits: {
    windowMs: number;
    puppeteer: number;
    ai: number;
    aiHeavy: number;
    pdf: number;
  };
  limits: {
    aiText: number;
    pdfText: number;
  };
};

let cached: ResourceSettings | null = null;
let cachedAt = 0;

const DEFAULTS: ResourceSettings = {
  puppeteer: {
    enabled: envBool("PUPPETEER_ENABLED", true),
    concurrency: envInt("PUPPETEER_CONCURRENCY", 2),
  },
  rateLimits: {
    windowMs: envInt("RATE_LIMIT_WINDOW_MS", 60_000),
    puppeteer: envInt("RATE_LIMIT_PUPPETEER", 6),
    ai: envInt("RATE_LIMIT_AI", 20),
    aiHeavy: envInt("RATE_LIMIT_AI_HEAVY", 10),
    pdf: envInt("RATE_LIMIT_PDF", 20),
  },
  limits: {
    aiText: envInt("AI_TEXT_LIMIT", 20_000),
    pdfText: envInt("PDF_TEXT_LIMIT", 20_000),
  },
};

function parseToggle(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  return fallback;
}

function parseIntValue(
  value: string | undefined,
  fallback: number,
  options?: { min?: number; max?: number }
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  let next = parsed;
  if (options?.min !== undefined) next = Math.max(options.min, next);
  if (options?.max !== undefined) next = Math.min(options.max, next);
  return next;
}

function pickSetting(map: Record<string, string>, key: string): string | undefined {
  if (key in map) return map[key];
  const lower = key.toLowerCase();
  if (lower in map) return map[lower];
  const upper = key.toUpperCase();
  if (upper in map) return map[upper];
  return undefined;
}

async function readSettings(): Promise<Record<string, string>> {
  const rows = await prisma.$queryRaw<Array<{ name: string; value: string | null }>>(
    Prisma.sql`SELECT name, value FROM settings WHERE name IN (${Prisma.join(SETTINGS_KEYS)})`
  );

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.name] = row.value ? String(row.value) : "";
  }
  return map;
}

export async function getResourceSettings(): Promise<ResourceSettings> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  let settings: Record<string, string> | null = null;
  try {
    settings = await readSettings();
  } catch {
    settings = null;
  }

  if (!settings) {
    cached = DEFAULTS;
    cachedAt = now;
    return DEFAULTS;
  }

  const puppeteerEnabled = parseToggle(
    pickSetting(settings, "PUPPETEER_ENABLED"),
    DEFAULTS.puppeteer.enabled
  );
  const puppeteerConcurrency = parseIntValue(
    pickSetting(settings, "PUPPETEER_CONCURRENCY"),
    DEFAULTS.puppeteer.concurrency,
    { min: 1 }
  );

  const windowMs = parseIntValue(
    pickSetting(settings, "RATE_LIMIT_WINDOW_MS"),
    DEFAULTS.rateLimits.windowMs,
    { min: 1000 }
  );
  const ratePuppeteer = parseIntValue(
    pickSetting(settings, "RATE_LIMIT_PUPPETEER"),
    DEFAULTS.rateLimits.puppeteer,
    { min: 1 }
  );
  const rateAi = parseIntValue(
    pickSetting(settings, "RATE_LIMIT_AI"),
    DEFAULTS.rateLimits.ai,
    { min: 1 }
  );
  const rateAiHeavy = parseIntValue(
    pickSetting(settings, "RATE_LIMIT_AI_HEAVY"),
    DEFAULTS.rateLimits.aiHeavy,
    { min: 1 }
  );
  const ratePdf = parseIntValue(
    pickSetting(settings, "RATE_LIMIT_PDF"),
    DEFAULTS.rateLimits.pdf,
    { min: 1 }
  );

  const aiTextLimit = parseIntValue(
    pickSetting(settings, "AI_TEXT_LIMIT"),
    DEFAULTS.limits.aiText,
    { min: 500 }
  );
  const pdfTextLimit = parseIntValue(
    pickSetting(settings, "PDF_TEXT_LIMIT"),
    DEFAULTS.limits.pdfText,
    { min: 500 }
  );

  cached = {
    puppeteer: {
      enabled: puppeteerEnabled,
      concurrency: puppeteerConcurrency,
    },
    rateLimits: {
      windowMs,
      puppeteer: ratePuppeteer,
      ai: rateAi,
      aiHeavy: rateAiHeavy,
      pdf: ratePdf,
    },
    limits: {
      aiText: aiTextLimit,
      pdfText: pdfTextLimit,
    },
  };
  cachedAt = now;
  return cached;
}
