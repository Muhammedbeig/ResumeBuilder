import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { json } from "@/lib/json";
import { getGeminiModel } from "@/lib/gemini";
import { panelInternalGet, panelInternalPost, PanelInternalApiError } from "@/lib/panel-internal-api";
import { getSessionUserId } from "@/lib/session-user";
import { requireAnnualAccess } from "@/lib/ai-access";

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
    .replace(/[â€œâ€]/g, '"')
    .replace(/[â€˜â€™]/g, "'")
    .replace(/,\s*([}\]])/g, "$1");
}

function extractJson(textResponse: string) {
  const fenced = textResponse.match(/```json([\s\S]*?)```/) || textResponse.match(/```([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : textResponse;

  try {
    return tryParseJson(candidate);
  } catch {
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
  const userId = getSessionUserId(session);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await panelInternalGet<{ reports: any[] }>("market-value", { userId });
    return json({ reports: data.reports ?? [] });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return json({ error: error.message }, { status: error.status });
    }
    return json({ error: "Failed to load reports" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireAnnualAccess();
  if (access) return access;

  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const resumeJson = body?.resumeJson;
  const resumeId = typeof body?.resumeId === "string" ? body.resumeId : null;
  const source = body?.source === "upload" ? "upload" : "resume";
  const targetRole = typeof body?.targetRole === "string" ? body.targetRole : "";
  const location = typeof body?.location === "string" ? body.location : "";

  if (!resumeJson || typeof resumeJson !== "object") {
    return json({ error: "resumeJson is required" }, { status: 400 });
  }

  const model = await getGeminiModel();
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
    const reportJson = extractJson(response.text());

    const stored = await panelInternalPost<{ report: any }>("market-value", {
      userId,
      body: {
        resumeId,
        source,
        periodLabel,
        reportJson,
        resumeJson,
      },
    });

    return json({ report: stored.report });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Market value report error:", error);
    return json({ error: "Failed to generate report" }, { status: 500 });
  }
}
