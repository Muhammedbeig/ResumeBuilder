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
    const data = await panelInternalGet<{ cvs: any[] }>("cvs", { userId });
    return json({ cvs: data.cvs ?? [] });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return json({ error: error.message }, { status: error.status });
    }
    return json({ error: "Failed to load CVs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title : "Untitled CV";
  const template = typeof body?.template === "string" ? body.template : "academic-cv";
  const data = normalizeResumeData(body?.data);
  const source = typeof body?.source === "string" ? body.source : "manual";

  try {
    const result = await panelInternalPost<{ cv: any; data: Record<string, unknown> }>("cvs", {
      userId,
      body: {
        title,
        template,
        data,
        source,
      },
    });
    return json({
      cv: result.cv,
      data: normalizeResumeData(result.data),
    });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return json({ error: error.message }, { status: error.status });
    }
    return json({ error: "Failed to create CV" }, { status: 500 });
  }
}
