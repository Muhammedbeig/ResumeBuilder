export type PlanChoice = "free" | "paid";

export const LEGACY_PLAN_CHOICE_KEY = "resupro_plan_choice";
const USER_STORAGE_PREFIX = "resupro_plan_choice_user_";
const GUEST_STORAGE_KEY = "resupro_plan_choice_guest";

function normalizeUserId(userId?: string | null): string | null {
  if (!userId) return null;
  const trimmed = userId.trim();
  if (!trimmed) return null;
  return trimmed.replace(/[^A-Za-z0-9_-]/g, "_");
}

export function getPlanChoiceStorageKey(userId?: string | null): string {
  const normalized = normalizeUserId(userId);
  return normalized ? `${USER_STORAGE_PREFIX}${normalized}` : GUEST_STORAGE_KEY;
}

export function getPlanChoiceCookieKey(userId?: string | null): string {
  const normalized = normalizeUserId(userId);
  return normalized ? `${USER_STORAGE_PREFIX}${normalized}` : LEGACY_PLAN_CHOICE_KEY;
}

export function parsePlanChoice(value: unknown): PlanChoice | null {
  if (value === "free" || value === "paid") return value;
  return null;
}
