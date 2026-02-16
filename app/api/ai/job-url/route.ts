import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { load as loadHtml } from "cheerio";

import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getResourceSettings } from "@/lib/resource-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIORITY_SELECTORS = [
  "main",
  "article",
  "section",
  "[class*='job']",
  "[id*='job']",
  "[class*='description']",
  "[id*='description']",
  "[class*='content']",
  "[data-testid*='job']",
  "#jobDescriptionText",
  "[id*='jobDescriptionText']",
  "[class*='job-description']",
  "[class*='show-more-less-html']",
  "[data-testid*='job-description']",
  "[data-test='jobsearch-JobComponent-description']",
];

const KEYWORDS = [
  "responsibilities",
  "requirements",
  "qualification",
  "skills",
  "experience",
  "about the role",
  "what you'll do",
  "what you will do",
  "job description",
];

const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const FETCH_TIMEOUT_MS = 20_000;
const MAX_URL_INPUT_LENGTH = 200_000;
const MAX_REDIRECT_UNWRAP_DEPTH = 4;
const REDIRECT_PARAM_KEYS = ["url", "u", "q", "target", "redirect", "redirect_url", "redirect_uri", "r"];

const normalizeWhitespace = (value: string) =>
  value
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const stripTrailingPunctuation = (value: string) => {
  let candidate = value.trim();
  while (candidate.length > 0 && /[)\].,;!?]$/.test(candidate)) {
    if (candidate.endsWith(")")) {
      const openCount = (candidate.match(/\(/g) ?? []).length;
      const closeCount = (candidate.match(/\)/g) ?? []).length;
      if (openCount >= closeCount) break;
    }
    candidate = candidate.slice(0, -1);
  }
  return candidate;
};

const extractFirstUrl = (input: string) => {
  const normalized = normalizeWhitespace(input.slice(0, MAX_URL_INPUT_LENGTH));
  const directCandidate = stripTrailingPunctuation(normalized);
  if (/^https?:\/\//i.test(directCandidate)) {
    return directCandidate;
  }

  const matched = normalized.match(/https?:\/\/[^\s<>"']+/i);
  if (matched) return stripTrailingPunctuation(matched[0]);

  // Accept bare domains like linkedin.com/jobs/view/... or www.example.com/...
  const bareDomainMatch = normalized.match(
    /(?:^|\s)((?:www\.)?[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:\/[^\s<>"']*)?)/i
  );
  if (bareDomainMatch?.[1]) {
    return stripTrailingPunctuation(bareDomainMatch[1]);
  }

  return "";
};

const tryParseUrl = (value: string): URL | null => {
  try {
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const maybeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const unwrapRedirectUrl = (initialUrl: URL, depth = 0): URL => {
  if (depth >= MAX_REDIRECT_UNWRAP_DEPTH) return initialUrl;

  for (const key of REDIRECT_PARAM_KEYS) {
    const raw = initialUrl.searchParams.get(key);
    if (!raw) continue;
    const decoded = stripTrailingPunctuation(maybeDecodeURIComponent(raw));
    const nested = tryParseUrl(decoded);
    if (!nested) continue;
    if (nested.toString() === initialUrl.toString()) continue;
    return unwrapRedirectUrl(nested, depth + 1);
  }

  return initialUrl;
};

const normalizeUrl = (urlInput: string) => {
  const candidate = extractFirstUrl(urlInput);
  if (!candidate) {
    throw new Error("Invalid URL");
  }

  const parsed = tryParseUrl(candidate);
  if (!parsed) {
    throw new Error("Only http/https URLs are supported.");
  }

  const unwrapped = unwrapRedirectUrl(parsed);
  unwrapped.hash = "";
  return unwrapped.toString();
};

const cleanText = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

const scoreCandidate = (text: string) => {
  const lower = text.toLowerCase();
  const keywordScore = KEYWORDS.reduce((acc, keyword) => acc + (lower.includes(keyword) ? 1 : 0), 0);
  return text.length + keywordScore * 500;
};

const trimToMax = (text: string, max = 12000) => (text.length > max ? text.slice(0, max) : text);

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function extractFromJsonLd(html: string): string {
  const $ = loadHtml(html);
  let best = "";

  $("script[type='application/ld+json']").each((_, node) => {
    const raw = $(node).text();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];

      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) continue;
        if (Array.isArray(item)) {
          queue.push(...item);
          continue;
        }
        if (typeof item !== "object") continue;
        const typed = item as Record<string, unknown>;
        const typeValue = String(typed["@type"] ?? "").toLowerCase();
        const description = String(typed.description ?? "").trim();
        if (description && (typeValue.includes("jobposting") || typeValue.includes("job"))) {
          if (description.length > best.length) best = description;
        }
        if (typed["@graph"] && Array.isArray(typed["@graph"])) {
          queue.push(...typed["@graph"]);
        }
      }
    } catch {
      // ignore malformed json-ld blocks
    }
  });

  return cleanText(best);
}

function extractFromHtml(html: string): string {
  const $ = loadHtml(html);
  $("script, style, noscript").remove();

  const candidates: string[] = [];

  for (const selector of PRIORITY_SELECTORS) {
    $(selector).each((_, node) => {
      const text = cleanText($(node).text() || "");
      if (text.length > 120) candidates.push(text);
    });
  }

  const bodyText = cleanText($("body").text() || "");
  if (bodyText.length > 120) candidates.push(bodyText);

  if (candidates.length === 0) return "";

  candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  return candidates[0] ?? "";
}

function extractFromMeta(html: string): string {
  const $ = loadHtml(html);
  const candidates = [
    $("meta[property='og:description']").attr("content") || "",
    $("meta[name='description']").attr("content") || "",
    $("meta[name='twitter:description']").attr("content") || "",
  ]
    .map((value) => cleanText(value))
    .filter((value) => value.length > 40);

  if (candidates.length === 0) return "";
  candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  return candidates[0] ?? "";
}

function extractFromDocument(raw: string): string {
  const source = cleanText(raw);
  if (!source) return "";

  const looksLikeHtml = /<html|<body|<main|<article|<section|<script/i.test(raw);
  if (!looksLikeHtml) {
    return source;
  }

  const jsonLdText = extractFromJsonLd(raw);
  const htmlText = extractFromHtml(raw);
  const metaText = extractFromMeta(raw);

  const candidates = [jsonLdText, htmlText, metaText, source].filter(Boolean);
  candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  return candidates[0] ?? "";
}

function buildJinaFallbackUrls(targetUrl: string) {
  const withoutProtocol = targetUrl.replace(/^https?:\/\//i, "");
  return [
    `https://r.jina.ai/https://${withoutProtocol}`,
    `https://r.jina.ai/http://${withoutProtocol}`,
    `https://r.jina.ai/${targetUrl}`,
  ];
}

async function extractJobTextFromUrl(url: string): Promise<string> {
  const primaryAttempts: Array<{ url: string; headers: HeadersInit }> = [
    {
      url,
      headers: {
        "User-Agent": DESKTOP_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    },
    {
      url,
      headers: {
        "User-Agent": MOBILE_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    },
  ];

  for (const attempt of primaryAttempts) {
    try {
      const response = await fetchWithTimeout(attempt.url, {
        headers: attempt.headers,
        redirect: "follow",
        cache: "no-store",
      });
      if (!response.ok) continue;

      const body = await response.text();
      const extracted = extractFromDocument(body);
      if (extracted.length >= 120) return extracted;
    } catch {
      // continue to next attempt
    }
  }

  const fallbackUrls = buildJinaFallbackUrls(url);
  for (const fallbackUrl of fallbackUrls) {
    try {
      const response = await fetchWithTimeout(
        fallbackUrl,
        {
          headers: {
            "User-Agent": DESKTOP_USER_AGENT,
            Accept: "text/plain,text/html,*/*",
          },
          redirect: "follow",
          cache: "no-store",
        },
        25_000
      );
      if (!response.ok) continue;

      const body = await response.text();
      const extracted = extractFromDocument(body);
      if (extracted.length >= 120) return extracted;
    } catch {
      // continue to next fallback
    }
  }

  return "";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planId = session.user.subscriptionPlanId ?? null;
  const isBusiness = session.user.subscription === "business";
  const hasAccess = isBusiness || planId === "monthly" || planId === "annual";
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Auto-Tailor from job URL is available in Monthly and Annual plans." },
      { status: 402 }
    );
  }

  const resourceSettings = await getResourceSettings();
  const rateLimitResponse = rateLimit(request, {
    prefix: "ai-job-url",
    limit: resourceSettings.rateLimits.aiHeavy,
    windowMs: resourceSettings.rateLimits.windowMs,
    key: session.user.id ? `user:${session.user.id}` : undefined,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { url } = (await request.json()) as { url?: string };
  if (!url) {
    return NextResponse.json({ error: "Job URL is required" }, { status: 400 });
  }

  let normalized: string;
  try {
    normalized = normalizeUrl(url);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid URL" },
      { status: 400 }
    );
  }

  let text = "";
  try {
    text = cleanText(await extractJobTextFromUrl(normalized));
  } catch (error) {
    console.error("Job URL extraction failed", error);
  }

  if (!text || text.length < 120) {
    return NextResponse.json(
      { error: "Unable to extract job description from this URL. Please paste it manually." },
      { status: 422 }
    );
  }

  return NextResponse.json({
    text: trimToMax(text, resourceSettings.limits.aiText),
    sourceUrl: normalized,
  });
}
