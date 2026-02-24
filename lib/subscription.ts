export type NormalizedPlanId = "weekly" | "monthly" | "annual" | null;

const PAID_SUBSCRIPTION_VALUES = new Set([
  "pro",
  "business",
  "premium",
  "paid",
  "weekly",
  "monthly",
  "annual",
  "plus",
  "active",
  "subscribed",
]);

const FREE_SUBSCRIPTION_VALUES = new Set([
  "",
  "free",
  "freemium",
  "basic",
  "none",
  "guest",
  "trial",
]);

function normalizeText(value?: string | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizePlanId(value?: string | null): NormalizedPlanId {
  const normalized = normalizeText(value);
  if (
    normalized === "weekly" ||
    normalized === "monthly" ||
    normalized === "annual"
  ) {
    return normalized;
  }
  return null;
}

export function isPaidSubscriptionValue(value?: string | null): boolean {
  const normalized = normalizeText(value);
  if (FREE_SUBSCRIPTION_VALUES.has(normalized)) {
    return false;
  }
  if (PAID_SUBSCRIPTION_VALUES.has(normalized)) {
    return true;
  }
  return false;
}

export function hasPaidAccess(
  subscription?: string | null,
  subscriptionPlanId?: string | null,
): boolean {
  if (normalizePlanId(subscriptionPlanId)) {
    return true;
  }
  return isPaidSubscriptionValue(subscription);
}

export function normalizeSubscriptionLevel(
  subscription?: string | null,
  subscriptionPlanId?: string | null,
): "free" | "pro" | "business" {
  if (!hasPaidAccess(subscription, subscriptionPlanId)) {
    return "free";
  }

  const normalizedSubscription = normalizeText(subscription);
  if (
    normalizedSubscription === "business" ||
    normalizePlanId(subscriptionPlanId) === "annual"
  ) {
    return "business";
  }

  return "pro";
}

