import { Suspense } from "react";
import PricingPageClient from "@/app/pricing/PricingPageClient";

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingPageClient />
    </Suspense>
  );
}
