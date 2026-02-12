import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { extractJson } from "@/lib/ai-utils";
import { requirePaidAiAccess } from "@/lib/ai-access";
import { rateLimit } from "@/lib/rate-limit";
import { truncateText } from "@/lib/limits";
import { getResourceSettings } from "@/lib/resource-settings";

export async function POST(request: Request) {
  const access = await requirePaidAiAccess();
  if (access) return access;

  const resourceSettings = await getResourceSettings();

  const rateLimitResponse = rateLimit(request, {
    prefix: "ai-suggestions-skills",
    limit: resourceSettings.rateLimits.ai,
    windowMs: resourceSettings.rateLimits.windowMs,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const body = await request.json().catch(() => ({}));
  const jobTitle = truncateText(
    String(body?.jobTitle || "").trim(),
    resourceSettings.limits.aiText
  );
  const description = truncateText(
    String(body?.description || "").trim(),
    resourceSettings.limits.aiText
  );

  if (!jobTitle && !description) {
    return NextResponse.json({ error: "Job title or description is required" }, { status: 400 });
  }

  try {
    const model = await getGeminiModel();
    const prompt = `You are a career expert. Suggest relevant technical skills (hard skills) and soft skills for a professional with the following job title and/or description.

Job Title: ${jobTitle}
${description ? `Description: ${description}` : ""}

Return a JSON object with two arrays:
- "hardSkills": List of 10-15 relevant technical tools, languages, frameworks, or methodologies.
- "softSkills": List of 5-8 relevant soft skills (e.g., Leadership, Communication).

Format:
{
  "hardSkills": ["string"],
  "softSkills": ["string"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let suggestions: any = { hardSkills: [], softSkills: [] };
    try {
      suggestions = extractJson(text);
    } catch (e) {
      console.error("Failed to parse AI response", text);
      return NextResponse.json({ hardSkills: [], softSkills: [] });
    }

    const hardSkills = Array.isArray(suggestions.hardSkills)
      ? (suggestions.hardSkills as unknown[])
          .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
          .filter((item) => item.length > 0)
      : [];
    const softSkills = Array.isArray(suggestions.softSkills)
      ? (suggestions.softSkills as unknown[])
          .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
          .filter((item) => item.length > 0)
      : [];

    return NextResponse.json({ hardSkills, softSkills });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

