import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { panelInternalGet, PanelInternalApiError } from "@/lib/panel-internal-api";
import { getSessionUserId } from "@/lib/session-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionData = {
  subscription: "free" | "pro" | "business";
  subscriptionPlanId: "weekly" | "monthly" | "annual" | null;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await panelInternalGet<SubscriptionData>("user/subscription", { userId });
    return NextResponse.json({
      subscription: data.subscription ?? "free",
      subscriptionPlanId: data.subscriptionPlanId ?? null,
    });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load subscription" }, { status: 500 });
  }
}
