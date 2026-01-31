import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGeminiModel } from "@/lib/gemini";
import { extractJson } from "@/lib/ai-utils";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const jobTitle = String(body?.jobTitle || "").trim();
  const company = String(body?.company || "").trim();

  if (!jobTitle) {
    return NextResponse.json({ error: "Job title is required" }, { status: 400 });
  }

  try {
    const model = getGeminiModel();
    const prompt = `You are a professional resume writer. Generate a list of impactful resume bullet points for the following role.

Role: ${jobTitle}
${company ? `Company: ${company}` : ""}

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
    
    let data = { responsibilities: [] };
    try {
      data = extractJson(text);
    } catch (e) {
      console.error("Failed to parse AI response", text);
       return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
