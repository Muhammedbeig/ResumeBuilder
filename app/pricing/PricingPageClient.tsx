"use client";

import { PricingPlans } from "@/components/pricing/PricingPlans";
import { Skeleton } from "@/components/ui/skeleton";
import { usePricingCards } from "@/hooks/use-pricing-cards";

function PricingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Skeleton className="mx-auto h-6 w-28 rounded-full" />
          <Skeleton className="mx-auto mt-5 h-10 w-80 max-w-full" />
          <Skeleton className="mx-auto mt-3 h-6 w-96 max-w-full" />
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
          {[0, 1, 2, 3].map((key) => (
            <div
              key={`pricing-card-skeleton-${key}`}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <Skeleton className="h-14 w-14 rounded-xl" />
              <Skeleton className="mt-6 h-8 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/2" />
              <Skeleton className="mt-5 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
              <Skeleton className="mt-6 h-10 w-24" />
              <div className="mt-6 space-y-3">
                {[0, 1, 2, 3].map((feature) => (
                  <div key={`pricing-feature-skeleton-${key}-${feature}`} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="mt-8 h-12 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PricingPageClient() {
  const { cards, loaded } = usePricingCards();
  if (!loaded) return <PricingPageSkeleton />;
  return <PricingPlans cards={cards} />;
}
