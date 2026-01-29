"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const plans = [
  {
    name: 'Basic',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Sparkles,
    features: [
      '1 Resume',
      '1 Template',
      '5 AI Rewrites/month',
      'Basic PDF Export',
      'Community Support'
    ],
    cta: 'Get Started Free',
    popular: false,
    gradient: 'from-gray-500 to-gray-600'
  },
  {
    name: 'Pro',
    description: 'Best for serious job seekers',
    monthlyPrice: 9,
    yearlyPrice: 72,
    icon: Zap,
    features: [
      'Unlimited Resumes',
      'All 30+ Templates',
      'Unlimited AI Rewrites',
      'Job Tailoring',
      'ATS Score Analysis',
      'Professional Profile',
      'Priority Support',
      'Analytics Dashboard'
    ],
    cta: 'Start Pro Trial',
    popular: true,
    gradient: 'from-purple-500 to-cyan-500'
  },
  {
    name: 'Business',
    description: 'For teams and agencies',
    monthlyPrice: 19,
    yearlyPrice: 156,
    icon: Crown,
    features: [
      'Everything in Pro',
      'Team Collaboration',
      'Custom Branding',
      'White-label Profiles',
      'API Access',
      'Dedicated Manager',
      'Custom Templates',
      'SSO Integration'
    ],
    cta: 'Contact Sales',
    popular: false,
    gradient: 'from-amber-500 to-orange-600'
  }
];

export function Pricing() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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
              {' '}Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-purple-600"
            />
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Yearly
            </span>
            {isYearly && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full"
              >
                Save 33%
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl transition-all duration-500 flex flex-col h-full ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-purple-600 to-cyan-500 text-white scale-105 shadow-2xl shadow-purple-500/25 z-10' 
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-xl'
                }`}
                style={{
                  transform: plan.popular ? 'perspective(1000px) rotateY(0deg)' : 'perspective(1000px) rotateY(5deg)',
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-purple-600 text-sm font-semibold rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                  plan.popular 
                    ? 'bg-white/20' 
                    : `bg-gradient-to-r ${plan.gradient}`
                }`}>
                  <Icon className={`w-7 h-7 ${plan.popular ? 'text-white' : 'text-white'}`} />
                </div>

                {/* Plan Name */}
                <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {plan.name}
                </h3>
                <p className={`mb-6 ${plan.popular ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={isYearly ? 'yearly' : 'monthly'}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="inline-block"
                        >
                          ${price}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <span className={`${plan.popular ? 'text-white/80' : 'text-gray-500'}`}>
                      /{isYearly ? 'year' : 'month'}
                    </span>
                  </div>
                  {isYearly && price > 0 && (
                    <p className={`text-sm mt-1 ${plan.popular ? 'text-white/60' : 'text-gray-500'}`}>
                      Billed annually (${Math.round(price / 12)}/month)
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.popular ? 'bg-white/20' : 'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        <Check className={`w-3 h-3 ${plan.popular ? 'text-white' : 'text-green-600'}`} />
                      </div>
                      <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className={`w-full py-6 rounded-xl font-semibold mt-auto ${
                    plan.popular 
                      ? 'bg-white text-purple-600 hover:bg-gray-100' 
                      : 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-700 hover:to-cyan-600'
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
