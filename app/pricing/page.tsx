import { PricingPlans } from "@/components/pricing/PricingPlans";
import { fetchPricingCards } from "@/lib/panel-pricing";

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ flow?: string; returnUrl?: string }>;
}) {
  const cards = await fetchPricingCards();
  const resolvedParams = searchParams ? await searchParams : undefined;
  return (
    <PricingPlans
      cards={cards}
      flow={resolvedParams?.flow}
      returnUrl={resolvedParams?.returnUrl}
    />
  );
}
