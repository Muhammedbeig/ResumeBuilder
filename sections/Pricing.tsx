"use client";

import { useRouter } from "next/navigation";
import { PricingSection } from "@/components/pricing/PricingSection";

export function Pricing() {
  const router = useRouter();

  return (
    <PricingSection
      mode="landing"
      onSelectPlan={() => {
        router.push("/pricing");
      }}
    />
  );
}
