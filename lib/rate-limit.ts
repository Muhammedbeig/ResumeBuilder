import { NextResponse } from "next/server";
import { envInt } from "@/lib/env";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  prefix?: string;
  key?: string;
  message?: string;
};

const store = new Map<string, RateLimitEntry>();

export const RATE_LIMITS = {
  windowMs: envInt("RATE_LIMIT_WINDOW_MS", 60_000),
  ai: envInt("RATE_LIMIT_AI", 20),
  aiHeavy: envInt("RATE_LIMIT_AI_HEAVY", 10),
  pdf: envInt("RATE_LIMIT_PDF", 20),
  puppeteer: envInt("RATE_LIMIT_PUPPETEER", 6),
};

function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return "unknown";
}

export function rateLimit(req: Request, options: RateLimitOptions) {
  const now = Date.now();
  const limit = options.limit;
  const windowMs = options.windowMs;
  const prefix = options.prefix ? `${options.prefix}:` : "";
  const baseKey = options.key ?? getClientIp(req);
  const key = `${prefix}${baseKey}`;

  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);

  if (entry.count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return NextResponse.json(
      {
        error: options.message ?? "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}
