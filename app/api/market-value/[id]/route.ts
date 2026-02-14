import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { json } from "@/lib/json";
import { panelInternalGet, PanelInternalApiError } from "@/lib/panel-internal-api";
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
    const data = await panelInternalGet<{ report: any }>(`market-value/${id}`, { userId });
    return json({ report: data.report });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return json({ error: error.message }, { status: error.status });
    }
    return json({ error: "Failed to load report" }, { status: 500 });
  }
}
