import { PricingSection } from "@/components/pricing/PricingSection";
import { fetchPricingCards } from "@/lib/panel-pricing";

export async function Pricing() {
  const cards = await fetchPricingCards();
  return <PricingSection mode="landing" cards={cards} />;
}
