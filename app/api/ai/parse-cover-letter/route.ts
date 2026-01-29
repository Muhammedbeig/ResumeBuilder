import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGeminiModel } from "@/lib/gemini";
import { extractJson } from "@/lib/ai-utils";
import type { CoverLetterData } from "@/types";

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
    const prompt = `Parse this text (which could be a Cover Letter or a Resume) and extract structured data for a Cover Letter. 
    If it's a Resume, map the personal details to 'personalInfo' and leave content/recipient empty or generic.
    If it's a Cover Letter, extract all fields.
    
    Return valid JSON with the following structure:
  {
    "personalInfo": {
      "fullName": "",
      "email": "",
      "phone": "",
      "address": "",
      "city": "",
      "zipCode": ""
    },
    "recipientInfo": {
      "managerName": "",
      "companyName": "",
      "address": "",
      "city": "",
      "zipCode": "",
      "email": ""
    },
    "content": {
      "subject": "",
      "greeting": "",
      "opening": "",
      "body": "",
      "closing": "",
      "signature": ""
    }
  }

  Text to parse:
  ${text}

  Extract as much information as possible. Use empty string for missing data. Return valid JSON only.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    let parsed: Partial<CoverLetterData> = {};
    try {
      parsed = extractJson<Partial<CoverLetterData>>(response.text());
    } catch {
      parsed = {};
    }

    return NextResponse.json({ data: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
