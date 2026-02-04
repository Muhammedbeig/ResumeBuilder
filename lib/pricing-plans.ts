export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  billingNote?: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
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
      "ResuPro link added to the resume",
      "QR code to open the online resume",
      "Basic cover letter templates",
    ],
    cta: "Start for Free",
  },
  {
    id: "job-hunt-pass",
    name: "Job Hunt Pass (Weekly Trial)",
    price: "$9/week",
    billingNote: "Auto-renews monthly",
    description: "Fast, unlimited AI help for active job seekers.",
    features: [
      "Full access to all 40+ templates",
      "Unlimited resume tailoring (Gemini 2.5 Flash)",
      "AI cover letter generator",
      "Designed for short, intense job hunts",
    ],
    cta: "Start Job Hunt Pass",
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "pro-monthly",
    name: "Pro Monthly",
    price: "$29/mo",
    billingNote: "Active seeker plan",
    description: "Everything you need for a competitive search and ongoing polish.",
    features: [
      "Everything in Job Hunt Pass",
      "Resume Roast (AI-powered audit)",
      "Auto-Tailor from a job URL",
      "LinkedIn sync with resume updates",
    ],
    cta: "Go Pro Monthly",
  },
  {
    id: "annual",
    name: "Annual (Career Management)",
    price: "$199/yr",
    billingNote: "Best value for long-term growth",
    description: "Strategic career support with premium AI and quarterly insights.",
    features: [
      "Priority access to Gemini 3 Pro",
      "Quarterly Market Value reports",
      "Unlimited versions and cloud storage",
    ],
    cta: "Start Annual Plan",
  },
];

export const PRICING_REGION_HINT =
  "Available in GCC, EU, UK, US, Canada, Austria, and select regions. Not available in most Asian countries.";
