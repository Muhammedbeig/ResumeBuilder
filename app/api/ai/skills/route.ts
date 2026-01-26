import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGeminiModel } from "@/lib/gemini";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const text = String(body?.text || "").trim();

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    const model = getGeminiModel();
    const prompt = `Extract technical and professional skills from this text.

Text: ${text}

Return only a comma-separated list of skills. Focus on:
- Technical tools and technologies
- Programming languages
- Frameworks and libraries
- Soft skills (leadership, communication, etc.)
- Industry-specific expertise

Skills:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const skillsText = response.text().trim();
    const skills = skillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    return NextResponse.json({ skills });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
