import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { extractJson } from "@/lib/ai-utils";
import { requirePaidAiAccess } from "@/lib/ai-access";

export async function POST(request: Request) {
  const access = await requirePaidAiAccess();
  if (access) return access;

  const body = await request.json().catch(() => ({}));
  const jobTitle = String(body?.jobTitle || "").trim();
  const description = String(body?.description || "").trim();

  if (!jobTitle) {
    return NextResponse.json({ error: "Job title is required" }, { status: 400 });
  }

  try {
    const model = await getGeminiModel();
    const prompt = `You are a professional resume writer. Generate a list of impactful resume bullet points for the following role.

Role: ${jobTitle}
${description ? `Description/Notes: ${description}` : ""}

Rules:
- Generate 5-7 bullet points.
- Use the STAR method (Situation, Task, Action, Result) where possible.
- Start with strong action verbs.
- Include placeholders for metrics (e.g., "[X]% increase", "$[Y] revenue").
- Be specific to the role.

Return a JSON object with a "responsibilities" array containing strings.

Format:
{
  "responsibilities": ["string"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let data = { responsibilities: [] as string[] };
    try {
      data = extractJson(text);
    } catch (e) {
      console.error("Failed to parse AI response", text);
      return NextResponse.json({ responsibilities: [] });
    }

    const cleaned = Array.isArray(data.responsibilities)
      ? data.responsibilities
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter((item) => item.length > 0)
      : [];
    if (cleaned.length === 0) {
      return NextResponse.json({ responsibilities: [] });
    }

    return NextResponse.json({ responsibilities: cleaned });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

