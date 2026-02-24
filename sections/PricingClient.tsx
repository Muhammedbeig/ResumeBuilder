"use client";

import { PricingSection } from "@/components/pricing/PricingSection";
import { usePricingCards } from "@/hooks/use-pricing-cards";

export function PricingClient() {
  const { cards } = usePricingCards();
  return <PricingSection mode="landing" cards={cards} />;
}

