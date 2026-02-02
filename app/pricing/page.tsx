export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Great for getting started with basic resume editing.",
      features: [
        "Unlimited resumes",
        "Core templates",
        "Limited AI suggestions",
        "PDF export",
      ],
      cta: "Current Plan",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$9/mo",
      description: "For professionals who want faster, smarter editing.",
      features: [
        "Everything in Free",
        "Expanded AI suggestions",
        "Premium templates",
        "Cover letter builder",
        "Priority export queue",
      ],
      cta: "Upgrade to Pro",
      highlight: true,
    },
    {
      name: "Business",
      price: "$29/mo",
      description: "For teams, agencies, and career services.",
      features: [
        "Everything in Pro",
        "Team workspaces",
        "Custom branding",
        "Bulk exports",
        "Dedicated support",
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">Pricing</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
            Simple plans for every career stage
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Pick a plan that matches your needs. Upgrade anytime to unlock more AI suggestions and premium templates.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 shadow-sm bg-white dark:bg-gray-900 ${
                plan.highlight
                  ? "border-purple-500 ring-2 ring-purple-200 dark:ring-purple-900"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h2>
                {plan.highlight && (
                  <span className="text-xs font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
              </div>
              <p className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">{plan.price}</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-gray-700 dark:text-gray-200">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    {feature}
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
          Need a custom plan or higher AI quota? Contact us for enterprise pricing.
        </div>
      </div>
    </div>
  );
}
