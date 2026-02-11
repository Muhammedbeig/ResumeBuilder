import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGeminiModel } from "@/lib/gemini";
import { extractJson } from "@/lib/ai-utils";
import { requirePaidAiAccess } from "@/lib/ai-access";
import type { ResumeData } from "@/types";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const access = await requirePaidAiAccess();
  if (access) return access;

  const body = await request.json().catch(() => ({}));
  const text = String(body?.text || "").trim();

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    const model = await getGeminiModel();
    const prompt = `Parse this resume text and extract structured data. Return valid JSON with the following structure:
  {
    "basics": {
      "name": "",
      "title": "",
      "location": "",
      "email": "",
      "phone": "",
      "linkedin": "",
      "github": "",
      "summary": ""
    },
    "experiences": [
      {
        "company": "",
        "role": "",
        "location": "",
        "startDate": "",
        "endDate": "",
        "current": false,
        "bullets": [""]
      }
    ],
    "education": [
      {
        "institution": "",
        "degree": "",
        "field": "",
        "startDate": "",
        "endDate": "",
        "gpa": ""
      }
    ],
    "skills": [
      {
        "name": "",
        "skills": [""]
      }
    ]
  }

  Resume text:
  ${text}

  Extract as much information as possible. Use empty string for missing data. Return valid JSON only.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    let parsed: Partial<ResumeData> = {};
    try {
      parsed = extractJson<Partial<ResumeData>>(response.text());
    } catch {
      parsed = {};
    }

    return NextResponse.json({ data: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

