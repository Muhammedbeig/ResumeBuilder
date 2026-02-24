import { PRICING_PLANS, type PricingPlan } from "@/lib/pricing-plans";
import type { PricingCard } from "@/lib/panel-pricing";

function planDuration(plan: PricingPlan): string {
  if (plan.planId === "weekly") return "7";
  if (plan.planId === "monthly") return "30";
  if (plan.planId === "annual") return "365";

  if (plan.interval === "week") return "7";
  if (plan.interval === "month") return "30";
  if (plan.interval === "year") return "365";

  const price = plan.price?.toLowerCase() ?? "";
  if (price.includes("week")) return "7";
  if (price.includes("mo")) return "30";
  if (price.includes("yr") || price.includes("year")) return "365";

  return plan.isPaid ? "30" : "unlimited";
}

function priceFromText(price?: string): number {
  if (!price) return 0;
  const cleaned = price.replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function planFinalPrice(plan: PricingPlan): number {
  if (
    typeof plan.amountCents === "number" &&
    Number.isFinite(plan.amountCents)
  ) {
    return plan.amountCents / 100;
  }
  return priceFromText(plan.price);
}

function classifySubtitle(plan: PricingPlan, finalPrice: number): string {
  if (finalPrice === 0) return 'The "Hook"';
  if (plan.planId === "weekly") return "Trial/Weekly";
  if (plan.planId === "monthly") return 'The "Active Seeker"';
  if (plan.planId === "annual") return 'The "Career Management"';
  return "Subscription";
}

function classifyGradient(
  index: number,
  isPopular: boolean,
  isFree: boolean,
): string {
  if (isFree) return "from-gray-500 to-gray-600";
  if (isPopular) return "from-purple-500 to-cyan-500";
  return index % 2 === 0 ? "from-amber-500 to-orange-600" : "from-slate-600 to-slate-800";
}

export function fallbackPricingCards(): PricingCard[] {
  const normalized = Array.isArray(PRICING_PLANS) ? PRICING_PLANS : [];
  const hasHighlight = normalized.some((plan) => plan.highlight);
  const cheapestPaidId = hasHighlight
    ? null
    : normalized.reduce<string | null>((bestId, plan) => {
        const price = planFinalPrice(plan);
        if (price <= 0) return bestId;
        if (!bestId) return plan.id;
        const bestPlan = normalized.find((candidate) => candidate.id === bestId);
        if (!bestPlan) return plan.id;
        return price < planFinalPrice(bestPlan) ? plan.id : bestId;
      }, null);

  return normalized.map((plan, index) => {
    const duration = planDuration(plan);
    const finalPrice = planFinalPrice(plan);
    const isPaid = plan.isPaid ?? finalPrice > 0;
    const isPopular = hasHighlight
      ? Boolean(plan.highlight)
      : isPaid && cheapestPaidId === plan.id;
    const isFree = !isPaid;
    const name = plan.name?.trim() || "Plan";
    const subtitle = classifySubtitle(plan, finalPrice);
    const description = plan.description?.trim() || "";
    const features = Array.isArray(plan.features) ? plan.features : [];
    const cta =
      plan.cta?.trim() || (isPaid ? `Choose ${name}` : "Get Started Free");

    return {
      packageId: plan.id,
      isPaid,
      isPopular,
      duration,
      finalPrice,
      name,
      subtitle,
      description,
      priceLabel: plan.price?.trim() || "$0/mo",
      features,
      cta,
      gradient: classifyGradient(index, isPopular, isFree),
      icon: !isPaid ? "sparkles" : isPopular ? "zap" : "crown",
    };
  });
}

