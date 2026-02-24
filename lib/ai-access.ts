import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { authOptions } from "@/lib/auth";
import {
  panelInternalGet,
  PanelInternalApiError,
} from "@/lib/panel-internal-api";
import { getPlanChoiceCookieKey, parsePlanChoice } from "@/lib/plan-choice";
import { getSessionUserId } from "@/lib/session-user";
import { hasPaidAccess, normalizePlanId } from "@/lib/subscription";

type SubscriptionData = {
  subscription: string | null;
  subscriptionPlanId: string | null;
};

type WorkerAccessContext = {
  userId: string;
  subscription: string | null;
  subscriptionPlanId: string | null;
  planChoice: "free" | "paid" | null;
};

async function fetchSubscription(
  userId: string,
): Promise<SubscriptionData | null> {
  try {
    return await panelInternalGet<SubscriptionData>("user/subscription", {
      userId,
    });
  } catch (error) {
    if (error instanceof PanelInternalApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

function resolveWorkerContext(request?: Request): WorkerAccessContext | null {
  if (!request) return null;

  const expectedKey = process.env.RB_WORKER_INTERNAL_KEY?.trim();
  if (!expectedKey) return null;

  const requestKey = request.headers.get("x-rb-worker-key")?.trim();
  if (!requestKey || requestKey !== expectedKey) return null;

  const userId = request.headers.get("x-rb-user-id")?.trim();
  if (!userId) return null;

  const rawSubscription = request.headers
    .get("x-rb-subscription")
    ?.trim()
    .toLowerCase();
  const subscription = rawSubscription || null;

  const subscriptionPlanId = normalizePlanId(
    request.headers
    .get("x-rb-subscription-plan")
    ?.trim()
    .toLowerCase(),
  );

  const planChoice = parsePlanChoice(
    request.headers.get("x-rb-plan-choice")?.trim().toLowerCase(),
  );

  return { userId, subscription, subscriptionPlanId, planChoice };
}

export async function requirePaidAiAccess(request?: Request) {
  const workerContext = resolveWorkerContext(request);
  const workerUserId = workerContext?.userId ?? null;
  const sessionUserId = workerUserId
    ? null
    : getSessionUserId(await getServerSession(authOptions));
  const userId = workerUserId ?? sessionUserId;

  let hasPaidChoice = workerContext?.planChoice === "paid";
  if (!workerUserId) {
    const cookieStore = await cookies();
    const planChoiceCookieKey = getPlanChoiceCookieKey(userId);
    const planChoice = parsePlanChoice(
      cookieStore.get(planChoiceCookieKey)?.value,
    );
    hasPaidChoice = planChoice === "paid";
  }

  const subscription =
    workerContext?.subscription !== null && workerContext
      ? {
          subscription: workerContext.subscription,
          subscriptionPlanId: workerContext.subscriptionPlanId,
        }
      : userId
        ? await fetchSubscription(userId)
        : null;
  const isSubscribed = hasPaidAccess(
    subscription?.subscription,
    subscription?.subscriptionPlanId,
  );

  if (!isSubscribed && !hasPaidChoice) {
    return NextResponse.json(
      { error: "AI is disabled for the free version." },
      { status: 402 },
    );
  }

  return null;
}

export async function requireAnnualAccess(request?: Request) {
  const workerContext = resolveWorkerContext(request);
  const workerUserId = workerContext?.userId ?? null;
  const sessionUserId = workerUserId
    ? null
    : getSessionUserId(await getServerSession(authOptions));
  const userId = workerUserId ?? sessionUserId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription =
    workerContext?.subscription !== null && workerContext
      ? {
          subscription: workerContext.subscription,
          subscriptionPlanId: workerContext.subscriptionPlanId,
        }
      : await fetchSubscription(userId);
  if (!subscription) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAnnual =
    hasPaidAccess(subscription.subscription, subscription.subscriptionPlanId) &&
    normalizePlanId(subscription.subscriptionPlanId) === "annual";
  if (!isAnnual) {
    return NextResponse.json(
      { error: "Annual plan required for Career Management reports." },
      { status: 402 },
    );
  }

  return null;
}
