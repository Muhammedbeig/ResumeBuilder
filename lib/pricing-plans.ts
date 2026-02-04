export type PricingPlan = {
  id: string;
  planId?: "weekly" | "monthly" | "annual";
  name: string;
  price: string;
  amountCents?: number;
  interval?: "week" | "month" | "year";
  billingNote?: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
  isPaid?: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Freemium (Free)",
    price: "$0/mo",
    billingNote: "Best for getting started",
    description: "Build a solid resume with essential tools and SEO-friendly sharing.",
    features: [
      "Few basic ATS-friendly templates",
      "Manual editor (no AI writing)",
      "Download as .txt or watermarked PDF",
      "Link of the website will be added",
      "QR code on resume to open online",
      "Basic cover letter templates",
    ],
    cta: "Start for Free",
    isPaid: false,
  },
  {
    id: "job-hunt-pass",
    planId: "weekly",
    name: "Job Hunt Pass (Weekly Trial)",
    price: "$7/week",
    amountCents: 700,
    interval: "week",
    billingNote: "Auto-renews monthly",
    description: "Fast, unlimited AI help for active job seekers.",
    features: [
      "Full access to all 40+ templates",
      "Unlimited resume tailoring (Gemini 2.5 Flash)",
      "AI cover letter generator",
      "Auto-renews to monthly plan",
    ],
    cta: "Start Job Hunt Pass",
    highlight: true,
    badge: "Most Popular",
    isPaid: true,
  },
  {
    id: "pro-monthly",
    planId: "monthly",
    name: "Pro Monthly",
    price: "$19/mo",
    amountCents: 1900,
    interval: "month",
    billingNote: "Active seeker plan",
    description: "Everything you need for a competitive search and ongoing polish.",
    features: [
      "All Job Hunt Pass features",
      "Resume Roast (AI audit)",
      "Auto-Tailor from job URL",
    ],
    cta: "Go Pro Monthly",
    isPaid: true,
  },
  {
    id: "annual",
    planId: "annual",
    name: "Annual (Career Management)",
    price: "$99/yr",
    amountCents: 9900,
    interval: "year",
    billingNote: "Best value for long-term growth",
    description: "Strategic career support with premium AI and quarterly insights.",
    features: [
      "Priority access to Gemini 3 Pro",
      "Quarterly \"Market Value\" reports",
      "Unlimited versions and cloud storage",
      "All Pro Monthly features",
    ],
    cta: "Start Annual Plan",
    isPaid: true,
  },
];

export const PRICING_REGION_HINT =
  "Available in GCC, EU, UK, US, Canada, Austria, and select regions. Not available in most Asian countries.";

export type PaidPlanId = "weekly" | "monthly" | "annual";

export const PAID_PLANS = PRICING_PLANS.filter(
  (plan): plan is PricingPlan & {
    planId: PaidPlanId;
    amountCents: number;
    interval: "week" | "month" | "year";
  } =>
    plan.isPaid === true &&
    !!plan.planId &&
    typeof plan.amountCents === "number" &&
    !!plan.interval
);

export const getPaidPlanById = (planId: PaidPlanId) =>
  PAID_PLANS.find((plan) => plan.planId === planId);
