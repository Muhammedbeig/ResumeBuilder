import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGeminiModel } from "@/lib/gemini";
import { requireAnnualAccess } from "@/lib/ai-access";
import type { Prisma } from "@prisma/client";

function getQuarterLabel(date = new Date()) {
  const year = date.getFullYear();
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}

function tryParseJson(raw: string) {
  return JSON.parse(raw);
}

function normalizeJsonString(raw: string) {
  return raw
    .replace(/^[\uFEFF\xA0]+/, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1");
}

function extractJson(textResponse: string) {
  const fenced =
    textResponse.match(/```json([\s\S]*?)```/) ||
    textResponse.match(/```([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : textResponse;

  try {
    return tryParseJson(candidate);
  } catch {
    // Try to extract the first top-level JSON object
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const sliced = candidate.slice(start, end + 1);
      try {
        return tryParseJson(sliced);
      } catch {
        const normalized = normalizeJsonString(sliced);
        return tryParseJson(normalized);
      }
    }

    const normalized = normalizeJsonString(candidate);
    return tryParseJson(normalized);
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await prisma.marketValueReport.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const access = await requireAnnualAccess();
  if (access) return access;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const resumeJson = body?.resumeJson;
  const resumeId = typeof body?.resumeId === "string" ? body.resumeId : null;
  const source = body?.source === "upload" ? "upload" : "resume";
  const targetRole = typeof body?.targetRole === "string" ? body.targetRole : "";
  const location = typeof body?.location === "string" ? body.location : "";

  if (!resumeJson || typeof resumeJson !== "object") {
    return NextResponse.json({ error: "resumeJson is required" }, { status: 400 });
  }

  const model = getGeminiModel();
  const periodLabel = getQuarterLabel();

  const prompt = `
You are a career market analyst. Generate a Quarterly "Market Value" report for the user based on their resume.
Return strict JSON with this exact structure:
{
  "summary": "string",
  "salaryBenchmark": {
    "range": "string",
    "notes": "string"
  },
  "skillDemand": {
    "increasing": ["string"],
    "decreasing": ["string"],
    "emerging": ["string"]
  },
  "competitivePositioning": {
    "strengths": ["string"],
    "gaps": ["string"],
    "peerComparison": "string"
  },
  "trendIdentification": {
    "market": "bull|bear|neutral",
    "signals": ["string"]
  },
  "recommendedActions": ["string"]
}

Context:
- Period: ${periodLabel}
- Target role: ${targetRole || "Not specified"}
- Location: ${location || "Not specified"}

Resume JSON:
${JSON.stringify(resumeJson)}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    const reportJson = extractJson(textResponse);

    const record = await prisma.marketValueReport.create({
      data: {
        userId,
        resumeId,
        source,
        periodLabel,
        reportJson: reportJson as Prisma.InputJsonValue,
        resumeJson: resumeJson as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ report: record });
  } catch (error) {
    console.error("Market value report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
