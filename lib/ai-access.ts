import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { authOptions } from "@/lib/auth";
import { panelInternalGet, PanelInternalApiError } from "@/lib/panel-internal-api";
import { getPlanChoiceCookieKey, parsePlanChoice } from "@/lib/plan-choice";
import { getSessionUserId } from "@/lib/session-user";

type SubscriptionData = {
  subscription: "free" | "pro" | "business";
  subscriptionPlanId: "weekly" | "monthly" | "annual" | null;
};

async function fetchSubscription(userId: string): Promise<SubscriptionData | null> {
  try {
    return await panelInternalGet<SubscriptionData>("user/subscription", { userId });
  } catch (error) {
    if (error instanceof PanelInternalApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function requirePaidAiAccess() {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);

  const cookieStore = await cookies();
  const planChoiceCookieKey = getPlanChoiceCookieKey(userId);
  const planChoice = parsePlanChoice(cookieStore.get(planChoiceCookieKey)?.value);
  const hasPaidChoice = planChoice === "paid";

  const subscription = userId ? await fetchSubscription(userId) : null;
  const isSubscribed = subscription?.subscription === "pro" || subscription?.subscription === "business";

  if (!isSubscribed && !hasPaidChoice) {
    return NextResponse.json({ error: "AI is disabled for the free version." }, { status: 402 });
  }

  return null;
}

export async function requireAnnualAccess() {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await fetchSubscription(userId);
  if (!subscription) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAnnual = subscription.subscription !== "free" && subscription.subscriptionPlanId === "annual";
  if (!isAnnual) {
    return NextResponse.json({ error: "Annual plan required for Career Management reports." }, { status: 402 });
  }

  return null;
}
