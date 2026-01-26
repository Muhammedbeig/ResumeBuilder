import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGeminiModel } from "@/lib/gemini";
import type { ResumeData } from "@/types";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const resumeData = body?.resumeData as ResumeData | undefined;
  const targetRole = body?.targetRole ? String(body.targetRole) : undefined;

  if (!resumeData) {
    return NextResponse.json({ error: "Resume data is required" }, { status: 400 });
  }

  try {
    const model = getGeminiModel();
    const experiences = resumeData.experiences
      .slice(0, 3)
      .map((exp) => `${exp.role} at ${exp.company}`)
      .join(", ");
    const skills = resumeData.skills
      .flatMap((group) => group.skills)
      .slice(0, 8)
      .join(", ");

    const prompt = `Write a professional summary for a resume.

Background:
- Name: ${resumeData.basics.name}
- Title: ${resumeData.basics.title}
- Recent Experience: ${experiences}
- Key Skills: ${skills}
${targetRole ? `- Target Role: ${targetRole}` : ""}

Write a compelling 2-3 sentence summary that highlights key achievements and value proposition. Focus on results and expertise. Make it engaging and professional.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
