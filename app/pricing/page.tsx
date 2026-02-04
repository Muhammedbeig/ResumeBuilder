import { PRICING_PLANS, PRICING_REGION_HINT } from "@/lib/pricing-plans";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">Pricing</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
            Plans Built for Every Stage of the Job Hunt
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Choose the tier that matches your search intensity. Upgrade only when you need AI-powered speed.
          </p>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {PRICING_REGION_HINT}
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 shadow-sm bg-white dark:bg-gray-900 ${
                plan.highlight
                  ? "border-purple-500 ring-2 ring-purple-200 dark:ring-purple-900"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h2>
                {plan.badge && (
                  <span className="text-xs font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}
              </div>
              <p className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{plan.price}</p>
              {plan.billingNote && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{plan.billingNote}</p>
              )}
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-gray-700 dark:text-gray-200">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`mt-6 w-full rounded-md px-4 py-2 text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-purple-400"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Free tier focuses on user acquisition and SEO-friendly sharing. Paid tiers unlock AI and advanced automation.
        </div>
      </div>
    </div>
  );
}
