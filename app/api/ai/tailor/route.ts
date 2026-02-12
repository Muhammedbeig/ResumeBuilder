import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { extractJson } from "@/lib/ai-utils";
import { requirePaidAiAccess } from "@/lib/ai-access";
import { rateLimit } from "@/lib/rate-limit";
import { truncateText } from "@/lib/limits";
import { getResourceSettings } from "@/lib/resource-settings";
import type { ResumeData, TailoringResult } from "@/types";

export async function POST(request: Request) {
  const access = await requirePaidAiAccess();
  if (access) return access;

  const resourceSettings = await getResourceSettings();

  const rateLimitResponse = rateLimit(request, {
    prefix: "ai-tailor",
    limit: resourceSettings.rateLimits.ai,
    windowMs: resourceSettings.rateLimits.windowMs,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const body = await request.json().catch(() => ({}));
  const resumeData = body?.resumeData as ResumeData | undefined;
  const jobDescription = body?.jobDescription;

  if (!resumeData || !jobDescription) {
    return NextResponse.json({ error: "Resume data and job description are required" }, { status: 400 });
  }

  const jobText =
    typeof jobDescription === "string"
      ? jobDescription
      : [
          jobDescription?.title ? `Title: ${jobDescription.title}` : "",
          jobDescription?.company ? `Company: ${jobDescription.company}` : "",
          jobDescription?.description ? `Description: ${jobDescription.description}` : "",
          Array.isArray(jobDescription?.requirements)
            ? `Requirements: ${jobDescription.requirements.join(", ")}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
  const limitedJobText = truncateText(jobText, resourceSettings.limits.aiText);

  try {
    const model = await getGeminiModel();
    
    const prompt = `You are a strict ATS (Applicant Tracking System) Auditor and Expert Resume Optimizer.

Role: 
1. Verify keyword matches with ZERO hallucinations.
2. Rewrite resume content to ACTIVELY INTEGRATE missing keywords with strict length constraints.

Job Description:
${limitedJobText}

Resume Data (JSON):
${JSON.stringify(resumeData)}

TASK 1: AUDIT (Keyword Matching)
- Extract ALL relevant keywords from the Job Description.
- Compare strictly against the Resume Data. Mark as "matched" ONLY if the exact term exists.

TASK 2: OPTIMIZE (Suggestion Generation)
- Identify experience bullet points to rewrite.
- **STRICT CONSTRAINT**: Each "suggested" rewrite MUST be under 220 characters AND under 30 words.
- **NO SENTENCE BREAKAGE**: Do not truncate mid-sentence. The suggestion must be a complete, professional, and impactful statement.
- **KEYWORD INJECTION**: You MUST inject "missingKeywords" into these rewrites.
- **FORMATTING**: Use PLAIN TEXT ONLY. NO bolding (**), NO italics, NO markdown symbols.

Return a SINGLE JSON object:
{
  "matchScore": number,
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "suggestions": [
    {
      "experienceId": "string",
      "bulletIndex": number,
      "original": "string",
      "suggested": "string", // STRICT LIMIT: < 220 chars, < 30 words. Plain text.
      "keywords": string[]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = extractJson<TailoringResult>(response.text());

    // Final safety filter for formatting and length
    if (data.suggestions && Array.isArray(data.suggestions)) {
      data.suggestions = data.suggestions
        .map(s => {
          // Remove any markdown
          let cleanText = s.suggested.replace(/\*\*/g, '').replace(/__/g, '').replace(/\*/g, '');
          
          // If the AI failed the length constraint, we attempt to keep only complete sentences that fit
          if (cleanText.length > 220 || cleanText.split(' ').length > 30) {
             const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
             let limitedText = "";
             for (const sentence of sentences) {
                 if ((limitedText + sentence).length <= 220 && (limitedText + sentence).split(' ').length <= 30) {
                     limitedText += sentence;
                 } else {
                     break;
                 }
             }
             cleanText = limitedText.trim() || cleanText.substring(0, 217) + "...";
          }

          return {
            ...s,
            suggested: cleanText
          };
        })
        // Filter out any suggestions that might have become empty after cleaning
        .filter(s => s.suggested.length > 0);
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

