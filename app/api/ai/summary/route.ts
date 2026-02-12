import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { requirePaidAiAccess } from "@/lib/ai-access";
import { extractSummarySuggestions } from "@/lib/summary-suggestions";
import { rateLimit } from "@/lib/rate-limit";
import { truncateText } from "@/lib/limits";
import { getResourceSettings } from "@/lib/resource-settings";
import type { ResumeData } from "@/types";

export async function POST(request: Request) {
  const access = await requirePaidAiAccess();
  if (access) return access;

  const resourceSettings = await getResourceSettings();

  const rateLimitResponse = rateLimit(request, {
    prefix: "ai-summary",
    limit: resourceSettings.rateLimits.ai,
    windowMs: resourceSettings.rateLimits.windowMs,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const body = await request.json().catch(() => ({}));
  const resumeData = body?.resumeData as ResumeData | undefined;
  const targetRoleRaw = body?.targetRole ? String(body.targetRole) : undefined;
  const targetRole = targetRoleRaw
    ? truncateText(targetRoleRaw, resourceSettings.limits.aiText)
    : undefined;

  if (!resumeData) {
    return NextResponse.json({ error: "Resume data is required" }, { status: 400 });
  }

  try {
    const model = await getGeminiModel();
    const experienceSummaries = resumeData.experiences
      .slice(0, 3)
      .map((exp) => {
        const bullets = exp.bullets?.filter((bullet) => bullet.trim()).slice(0, 3) || [];
        const bulletText = bullets.length > 0 ? ` Highlights: ${bullets.join(" | ")}` : "";
        return `${exp.role} at ${exp.company}.${bulletText}`;
      })
      .join("\n");
    const skills = resumeData.skills
      .flatMap((group) => group.skills)
      .slice(0, 8)
      .join(", ");

    const prompt = `Write 3 distinct professional summary options for a resume.

Background:
- Name: ${resumeData.basics.name}
- Title: ${resumeData.basics.title}
- Recent Experience:\n${experienceSummaries || "None provided"}
- Key Skills: ${skills}
${targetRole ? `- Target Role: ${targetRole}` : ""}

Requirements:
- Each option should be 2-3 sentences.
- Highlight key achievements and value proposition.
- Focus on results and expertise.
- Vary wording between options.

Return JSON only in this exact shape:
{"summaries":["...","...","..."]}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text().trim();
    const jsonCandidate = rawText
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();
    let summaries: string[] = [];

    try {
      const parsed = JSON.parse(jsonCandidate);
      summaries = extractSummarySuggestions(parsed);
    } catch {
      summaries = extractSummarySuggestions(rawText);
    }

    const limitedSummaries = summaries.slice(0, 3);
    const summary = limitedSummaries[0] ?? rawText;

    return NextResponse.json({ summary, summaries: limitedSummaries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

