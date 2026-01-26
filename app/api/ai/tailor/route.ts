import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGeminiModel } from "@/lib/gemini";
import { extractJson } from "@/lib/ai-utils";
import type { ResumeData, TailoringResult } from "@/types";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  try {
    const model = getGeminiModel();
    const keywordPrompt = `Extract key skills, qualifications, and requirements from this job description.

Job Description:
${jobText}

Return a JSON object with:
- "hardSkills": array of technical/hard skills
- "softSkills": array of soft skills
- "qualifications": array of qualifications
- "keywords": array of important keywords

Format as valid JSON.`;

    let keywords = { hardSkills: [], softSkills: [], qualifications: [], keywords: [] } as {
      hardSkills: string[];
      softSkills: string[];
      qualifications: string[];
      keywords: string[];
    };

    const keywordResult = await model.generateContent(keywordPrompt);
    const keywordResponse = await keywordResult.response;

    try {
      keywords = extractJson(keywordResponse.text());
    } catch {
      keywords = { hardSkills: [], softSkills: [], qualifications: [], keywords: [] };
    }

    const allJobKeywords = [
      ...keywords.hardSkills,
      ...keywords.softSkills,
      ...keywords.keywords,
    ].filter(Boolean);
    const resumeText = JSON.stringify(resumeData).toLowerCase();

    const matchedKeywords = allJobKeywords.filter((keyword) =>
      resumeText.includes(keyword.toLowerCase())
    );
    const missingKeywords = allJobKeywords.filter(
      (keyword) => !resumeText.includes(keyword.toLowerCase())
    );
    const matchScore = Math.round((matchedKeywords.length / allJobKeywords.length) * 100) || 0;

    const suggestions: TailoringResult["suggestions"] = [];
    for (const experience of resumeData.experiences) {
      for (let i = 0; i < experience.bullets.length; i++) {
        if (suggestions.length >= 5) break;
        const bullet = experience.bullets[i];
        const suggestionPrompt = `Rewrite this resume bullet to better match the job requirements.

Job Description:
${jobText}

Keywords to include: ${missingKeywords.slice(0, 3).join(", ")}
Current Bullet: ${bullet}

Rewrite the bullet to naturally incorporate relevant keywords and emphasize results that match the job requirements. Return only the rewritten bullet.`;

        try {
          const suggestionResult = await model.generateContent(suggestionPrompt);
          const suggestionResponse = await suggestionResult.response;
          const suggested = suggestionResponse.text().trim();

          if (suggested && suggested !== bullet) {
            suggestions.push({
              experienceId: experience.id,
              bulletIndex: i,
              original: bullet,
              suggested,
              keywords: missingKeywords.slice(0, 3),
            });
          }
        } catch {
          // Ignore suggestion errors
        }
      }
    }
    return NextResponse.json({
      matchScore,
      matchedKeywords,
      missingKeywords,
      suggestions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
