import { normalizePlanId } from "@/lib/subscription";

export type WorkerUserContext = {
  id: string;
  subscription: string | null;
  subscriptionPlanId: ReturnType<typeof normalizePlanId>;
};

export function getWorkerUserFromRequest(
  request: Request,
): WorkerUserContext | null {
  const expectedKey = process.env.RB_WORKER_INTERNAL_KEY?.trim();
  if (!expectedKey) return null;

  const requestKey = request.headers.get("x-rb-worker-key")?.trim();
  if (!requestKey || requestKey !== expectedKey) return null;

  const id = request.headers.get("x-rb-user-id")?.trim();
  if (!id) return null;

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

  return {
    id,
    subscription,
    subscriptionPlanId,
  };
}
