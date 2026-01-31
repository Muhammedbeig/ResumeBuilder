import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGeminiModel } from "@/lib/gemini";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const jobTitle = String(body?.jobTitle || "").trim();
  const company = String(body?.company || "").trim();

  if (!jobTitle) {
    return NextResponse.json({ error: "Job title is required" }, { status: 400 });
  }

  try {
    const model = getGeminiModel();
    const prompt = `Write a professional, 2-3 sentence summary of the typical responsibilities and impact for a ${jobTitle}${company ? ` at ${company}` : ""}.
    
Focus on:
- Key functions of the role.
- Typical value added to the organization.
- Professional tone.
- Do NOT use bullet points.

Summary:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text().trim();

    return NextResponse.json({ description });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
