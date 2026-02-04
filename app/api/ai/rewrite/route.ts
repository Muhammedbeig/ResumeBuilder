import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { requirePaidAiAccess } from "@/lib/ai-access";

export async function POST(request: Request) {
  const access = await requirePaidAiAccess();
  if (access) return access;

  const body = await request.json().catch(() => ({}));
  const bullet = String(body?.bullet || "").trim();
  const context = body?.context ? String(body.context) : "";

  if (!bullet) {
    return NextResponse.json({ error: "Bullet text is required" }, { status: 400 });
  }

  try {
    const model = getGeminiModel();
    const prompt = `You are an expert resume writer. Rewrite this bullet point to be more impactful using the STAR method (Situation, Task, Action, Result).

Focus on:
- Start with a strong action verb
- Include quantifiable metrics and results where possible
- Be concise and specific
- Avoid generic phrases

Original: ${bullet}
${context ? `Context: ${context}` : ""}

Rewritten bullet:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rewritten = response.text().trim();

    return NextResponse.json({ rewritten });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
