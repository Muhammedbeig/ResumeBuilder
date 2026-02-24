"use client";

import { PricingPlans } from "@/components/pricing/PricingPlans";
import { usePricingCards } from "@/hooks/use-pricing-cards";

export default function PricingPageClient() {
  const { cards } = usePricingCards();
  return <PricingPlans cards={cards} />;
}

