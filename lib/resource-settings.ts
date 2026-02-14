import "server-only";

import { envInt } from "@/lib/env";
import { panelInternalPost } from "@/lib/panel-internal-api";

const CACHE_TTL_MS = 60_000;

const SETTINGS_KEYS = [
  "AI_TEXT_LIMIT",
  "ai_text_limit",
] as const;

export type ResourceSettings = {
  pdfRender: {
    concurrency: number;
    timeoutMs: number;
  };
  rateLimits: {
    windowMs: number;
    pdfExport: number;
    pdf: number;
    ai: number;
    aiHeavy: number;
  };
  limits: {
    aiText: number;
    pdfText: number;
  };
};

let cached: ResourceSettings | null = null;
let cachedAt = 0;

const DEFAULTS: ResourceSettings = {
  pdfRender: {
    concurrency: envInt("PDF_RENDER_CONCURRENCY", envInt("PUPPETEER_CONCURRENCY", 2)),
    timeoutMs: envInt("PDF_RENDER_TIMEOUT_MS", 45_000),
  },
  rateLimits: {
    windowMs: envInt("RATE_LIMIT_WINDOW_MS", 60_000),
    pdfExport: envInt("RATE_LIMIT_PDF_EXPORT", envInt("RATE_LIMIT_PUPPETEER", envInt("RATE_LIMIT_PDF", 12))),
    pdf: envInt("RATE_LIMIT_PDF", 20),
    ai: envInt("RATE_LIMIT_AI", 20),
    aiHeavy: envInt("RATE_LIMIT_AI_HEAVY", 10),
  },
  limits: {
    aiText: envInt("AI_TEXT_LIMIT", 20_000),
    pdfText: envInt("PDF_TEXT_LIMIT", 20_000),
  },
};

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
  const data = await panelInternalPost<{ settings: Record<string, string | null> }>("settings/batch", {
    body: { keys: [...SETTINGS_KEYS] },
  });

  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(data.settings ?? {})) {
    map[key] = value ? String(value) : "";
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

  const aiTextLimit = parseIntValue(pickSetting(settings, "AI_TEXT_LIMIT"), DEFAULTS.limits.aiText, { min: 500 });
  const pdfTextLimit = DEFAULTS.limits.pdfText;

  cached = {
    pdfRender: DEFAULTS.pdfRender,
    rateLimits: DEFAULTS.rateLimits,
    limits: {
      aiText: aiTextLimit,
      pdfText: pdfTextLimit,
    },
  };
  cachedAt = now;
  return cached;
}
