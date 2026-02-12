import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withPuppeteerPage } from "@/lib/puppeteer";
import { rateLimit } from "@/lib/rate-limit";
import { getResourceSettings } from "@/lib/resource-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const normalizeUrl = (url: string) => {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http/https URLs are supported.");
  }
  return parsed.toString();
};

const cleanText = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

const extractFromHtml = (html: string) => {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|section|article|br|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return cleanText(cleaned);
};

const trimToMax = (text: string, max = 12000) =>
  text.length > max ? text.slice(0, max) : text;

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
    limit: resourceSettings.rateLimits.puppeteer,
    windowMs: resourceSettings.rateLimits.windowMs,
    key: session?.user?.id ? `user:${session.user.id}` : undefined,
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
    if (resourceSettings.puppeteer.enabled) {
      const extracted = await withPuppeteerPage(
        async (page) => {
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );
        await page.goto(normalized, { waitUntil: "domcontentloaded", timeout: 30000 });
        await new Promise((resolve) => setTimeout(resolve, 1200));

        return page.evaluate(() => {
          const keywords = [
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

          const candidates = Array.from(
            document.querySelectorAll(
              [
                "main",
                "article",
                "section",
                "[class*='job']",
                "[id*='job']",
                "[class*='description']",
                "[id*='description']",
                "[class*='content']",
                "[data-testid*='job']",
              ].join(",")
            )
          );

          const score = (text: string) => {
            const lower = text.toLowerCase();
            const keywordScore = keywords.reduce(
              (acc, keyword) => acc + (lower.includes(keyword) ? 1 : 0),
              0
            );
            return text.length + keywordScore * 500;
          };

          const best = candidates
            .map((el) => (el as HTMLElement).innerText || "")
            .filter((text) => text.trim().length > 200)
            .map((text) => ({ text, score: score(text) }))
            .sort((a, b) => b.score - a.score)[0];

          return best?.text || document.body?.innerText || "";
        });
        },
        {
          concurrency: resourceSettings.puppeteer.concurrency,
          enabled: resourceSettings.puppeteer.enabled,
        }
      );

      text = cleanText(extracted || "");
    }
  } catch (error) {
    console.error("Job URL puppeteer extraction failed", error);
  }

  if (!text || text.length < 200) {
    try {
      const response = await fetch(normalized);
      if (response.ok) {
        const html = await response.text();
        text = cleanText(extractFromHtml(html));
      }
    } catch (error) {
      console.error("Job URL fetch fallback failed", error);
    }
  }

  if (!text || text.length < 200) {
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
