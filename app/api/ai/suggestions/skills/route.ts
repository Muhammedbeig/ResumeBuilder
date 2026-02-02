import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { extractJson } from "@/lib/ai-utils";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const jobTitle = String(body?.jobTitle || "").trim();
  const description = String(body?.description || "").trim();

  if (!jobTitle && !description) {
    return NextResponse.json({ error: "Job title or description is required" }, { status: 400 });
  }

  try {
    const model = getGeminiModel();
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
