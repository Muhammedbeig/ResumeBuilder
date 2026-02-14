import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { json } from "@/lib/json";
import { panelInternalGet, panelInternalPost, PanelInternalApiError } from "@/lib/panel-internal-api";
import { normalizeResumeData } from "@/lib/resume-data";
import { getSessionUserId } from "@/lib/session-user";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await panelInternalGet<{ resumes: any[] }>("resumes", { userId });
    return json({ resumes: data.resumes ?? [] });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return json({ error: error.message }, { status: error.status });
    }
    return json({ error: "Failed to load resumes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title : "Untitled Resume";
  const template = typeof body?.template === "string" ? body.template : "modern";
  const data = normalizeResumeData(body?.data);
  const source = typeof body?.source === "string" ? body.source : "manual";

  try {
    const result = await panelInternalPost<{ resume: any; data: Record<string, unknown> }>("resumes", {
      userId,
      body: {
        title,
        template,
        data,
        source,
      },
    });
    return json({
      resume: result.resume,
      data: normalizeResumeData(result.data),
    });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return json({ error: error.message }, { status: error.status });
    }
    return json({ error: "Failed to create resume" }, { status: 500 });
  }
}
