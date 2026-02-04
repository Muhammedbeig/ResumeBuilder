import { Crown, Sparkles, Zap } from "lucide-react";

export type PricingDisplay = {
  pricingPlanId: "free" | "job-hunt-pass" | "pro-monthly" | "annual";
  name: string;
  subtitle: string;
  description: string;
  gradient: string;
  popular?: boolean;
  cta: string;
  icon: typeof Sparkles;
};

export const PRICING_DISPLAY: PricingDisplay[] = [
  {
    pricingPlanId: "free",
    name: "Freemium",
    subtitle: 'The "Hook"',
    description: "User acquisition and SEO",
    cta: "Get Started Free",
    popular: false,
    gradient: "from-gray-500 to-gray-600",
    icon: Sparkles,
  },
  {
    pricingPlanId: "job-hunt-pass",
    name: "Job Hunt Pass",
    subtitle: "Trial/Weekly",
    description: "Most popular tier for job seekers",
    cta: "Start Job Hunt Pass",
    popular: true,
    gradient: "from-purple-500 to-cyan-500",
    icon: Zap,
  },
  {
    pricingPlanId: "pro-monthly",
    name: "Pro Monthly",
    subtitle: 'The "Active Seeker"',
    description: "Everything in the Pass",
    cta: "Go Pro Monthly",
    popular: false,
    gradient: "from-amber-500 to-orange-600",
    icon: Crown,
  },
  {
    pricingPlanId: "annual",
    name: "Annual",
    subtitle: 'The "Career Management"',
    description: "For long-term career growth",
    cta: "Go Annual",
    popular: false,
    gradient: "from-slate-600 to-slate-800",
    icon: Crown,
  },
];
