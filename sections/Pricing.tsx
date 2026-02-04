"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Freemium",
    subtitle: 'The "Hook"',
    description: "User acquisition and SEO",
    price: "$0/mo",
    icon: Sparkles,
    features: [
      "Few basic ATS-friendly templates",
      "Manual editor (no AI writing)",
      "Download as .txt or watermarked PDF",
      "Link of the website will be added",
      "QR code on resume to open online",
      "Basic cover letter templates",
    ],
    cta: "Get Started Free",
    popular: false,
    gradient: "from-gray-500 to-gray-600",
  },
  {
    name: "Job Hunt Pass",
    subtitle: "Trial/Weekly",
    description: "Most popular tier for job seekers",
    price: "Weekly",
    icon: Zap,
    features: [
      "Full access to all 40+ templates",
      "Unlimited resume tailoring (Gemini 2.5 Flash)",
      "AI cover letter generator",
      "Auto-renews to monthly plan",
    ],
    cta: "Start Job Hunt Pass",
    popular: true,
    gradient: "from-purple-500 to-cyan-500",
  },
  {
    name: "Pro Monthly",
    subtitle: 'The "Active Seeker"',
    description: "Everything in the Pass",
    price: "Monthly",
    icon: Crown,
    features: [
      "Resume Roast (AI audit)",
      "Auto-Tailor from job URL",
      "LinkedIn Sync",
      "All Job Hunt Pass features",
    ],
    cta: "Go Pro Monthly",
    popular: false,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    name: "Annual",
    subtitle: 'The "Career Management"',
    description: "For long-term career growth",
    price: "Annual",
    icon: Crown,
    features: [
      "Priority access to Gemini 3 Pro",
      'Quarterly "Market Value" reports',
      "Unlimited versions and cloud storage",
      "All Pro Monthly features",
    ],
    cta: "Go Annual",
    popular: false,
    gradient: "from-slate-600 to-slate-800",
  },
];

export function Pricing() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Simple, Transparent
            <span className="bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
              {" "}Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Choose the plan that fits your job search timeline and goals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl transition-all duration-500 flex flex-col h-full ${
                  plan.popular
                    ? "bg-gradient-to-br from-purple-600 to-cyan-500 text-white scale-105 shadow-2xl shadow-purple-500/25 z-10"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-xl"
                }`}
                style={{
                  transform: plan.popular
                    ? "perspective(1000px) rotateY(0deg)"
                    : "perspective(1000px) rotateY(5deg)",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-purple-600 text-sm font-semibold rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                    plan.popular ? "bg-white/20" : `bg-gradient-to-r ${plan.gradient}`
                  }`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h3
                  className={`text-2xl font-bold mb-1 ${
                    plan.popular ? "text-white" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm font-semibold mb-3 ${
                    plan.popular ? "text-white/80" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {plan.subtitle}
                </p>
                <p className={`${plan.popular ? "text-white/80" : "text-gray-600 dark:text-gray-400"} mb-6`}>
                  {plan.description}
                </p>

                <div className="mb-8">
                  <span
                    className={`text-4xl font-bold ${
                      plan.popular ? "text-white" : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {plan.price}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          plan.popular ? "bg-white/20" : "bg-green-100 dark:bg-green-900/30"
                        }`}
                      >
                        <Check className={`w-3 h-3 ${plan.popular ? "text-white" : "text-green-600"}`} />
                      </div>
                      <span
                        className={`text-sm ${
                          plan.popular ? "text-white/90" : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full py-6 rounded-xl font-semibold mt-auto ${
                    plan.popular
                      ? "bg-white text-purple-600 hover:bg-gray-100"
                      : "bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-700 hover:to-cyan-600"
                  }`}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
