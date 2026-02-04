import { PricingPlans } from "@/components/pricing/PricingPlans";

export default function PricingPage({
  searchParams,
}: {
  searchParams?: { flow?: string; returnUrl?: string };
}) {
  return <PricingPlans flow={searchParams?.flow} returnUrl={searchParams?.returnUrl} />;
}
