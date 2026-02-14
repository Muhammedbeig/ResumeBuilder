import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { json } from "@/lib/json";
import { panelInternalPost, PanelInternalApiError } from "@/lib/panel-internal-api";
import { getSessionUserId } from "@/lib/session-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateAppDownloadLinkBody = {
  resourceType?: string;
  resourceId?: string;
  templateId?: string;
  data?: unknown;
  title?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreateAppDownloadLinkBody | null;

  try {
    const data = await panelInternalPost<{ resolverUrl: string; expiresAt: string }>("app-download-links", {
      userId,
      body,
    });
    return json({
      resolverUrl: data.resolverUrl,
      expiresAt: data.expiresAt,
    });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to create a download link." }, { status: 500 });
  }
}
