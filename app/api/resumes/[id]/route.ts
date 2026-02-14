import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { json } from "@/lib/json";
import {
  panelInternalDelete,
  panelInternalGet,
  panelInternalPut,
  PanelInternalApiError,
} from "@/lib/panel-internal-api";
import { normalizeResumeData } from "@/lib/resume-data";
import { getSessionUserId } from "@/lib/session-user";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const result = await panelInternalGet<{ resume: any; data: Record<string, unknown> }>(`resumes/${id}`, { userId });
    return json({
      resume: result.resume,
      data: normalizeResumeData(result.data),
    });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return json({ error: error.message }, { status: error.status });
    }
    return json({ error: "Failed to load resume" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const payload: Record<string, unknown> = {};
  if (typeof body?.title === "string") payload.title = body.title;
  if (typeof body?.template === "string") payload.template = body.template;
  if (typeof body?.isPublic === "boolean") payload.isPublic = body.isPublic;
  if (typeof body?.source === "string") payload.source = body.source;
  if ("data" in body) payload.data = normalizeResumeData(body?.data);

  try {
    const result = await panelInternalPut<{ resume: any; data: Record<string, unknown> }>(`resumes/${id}`, {
      userId,
      body: payload,
    });
    return json({
      resume: result.resume,
      data: normalizeResumeData(result.data),
    });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return json({ error: error.message }, { status: error.status });
    }
    return json({ error: "Failed to update resume" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const result = await panelInternalDelete<{ success: boolean }>(`resumes/${id}`, { userId });
    return json({ success: Boolean(result.success) });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return json({ error: error.message }, { status: error.status });
    }
    return json({ error: "Failed to delete resume" }, { status: 500 });
  }
}
