"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PricingCard, PricingCardIcon } from "@/lib/panel-pricing";

type PricingSectionProps = {
  mode: "landing" | "checkout";
  cards: PricingCard[];
  onSelectPackage?: (packageId?: string) => void;
  selectedPackageId?: string | null;
};

const iconMap: Record<PricingCardIcon, typeof Sparkles> = {
  sparkles: Sparkles,
  zap: Zap,
  crown: Crown,
};

export function PricingSection({
  mode,
  cards,
  onSelectPackage,
  selectedPackageId,
}: PricingSectionProps) {
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
          {cards.map((entry, index) => {
            const Icon = iconMap[entry.icon] ?? Sparkles;
            const isSelected =
              selectedPackageId && entry.isPaid ? selectedPackageId === entry.packageId : false;
            const ctaLabel =
              mode === "checkout"
                ? entry.isPaid
                  ? "Continue to Payment"
                  : "Continue with Free"
                : entry.cta;

            return (
              <motion.div
                key={entry.packageId}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl transition-all duration-500 flex flex-col h-full ${
                  entry.isPopular
                    ? "bg-gradient-to-br from-purple-600 to-cyan-500 text-white scale-105 shadow-2xl shadow-purple-500/25 z-10"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-xl"
                } ${isSelected ? "ring-4 ring-purple-500/40" : ""}`}
                style={{
                  transform: entry.isPopular
                    ? "perspective(1000px) rotateY(0deg)"
                    : "perspective(1000px) rotateY(5deg)",
                }}
              >
                {entry.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-purple-600 text-sm font-semibold rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                    entry.isPopular ? "bg-white/20" : `bg-gradient-to-r ${entry.gradient}`
                  }`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h3
                  className={`text-2xl font-bold mb-1 ${
                    entry.isPopular ? "text-white" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {entry.name}
                </h3>
                <p
                  className={`text-sm font-semibold mb-3 ${
                    entry.isPopular ? "text-white/80" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {entry.subtitle}
                </p>
                <p
                  className={`${entry.isPopular ? "text-white/80" : "text-gray-600 dark:text-gray-400"} mb-6`}
                >
                  {entry.description}
                </p>

                <div className="mb-8">
                  <span
                    className={`text-4xl font-bold ${
                      entry.isPopular ? "text-white" : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {entry.priceLabel}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {entry.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          entry.isPopular ? "bg-white/20" : "bg-green-100 dark:bg-green-900/30"
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 ${entry.isPopular ? "text-white" : "text-green-600"}`}
                        />
                      </div>
                      <span
                        className={`text-sm ${
                          entry.isPopular ? "text-white/90" : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {mode === "landing" && !onSelectPackage ? (
                  <Button
                    asChild
                    className={`w-full py-6 rounded-xl font-semibold mt-auto ${
                      entry.isPopular
                        ? "bg-white text-purple-600 hover:bg-gray-100"
                        : "bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-700 hover:to-cyan-600"
                    }`}
                  >
                    <Link href="/pricing">{ctaLabel}</Link>
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSelectPackage?.(entry.isPaid ? entry.packageId : undefined)}
                    className={`w-full py-6 rounded-xl font-semibold mt-auto ${
                      entry.isPopular
                        ? "bg-white text-purple-600 hover:bg-gray-100"
                        : "bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-700 hover:to-cyan-600"
                    }`}
                  >
                    {ctaLabel}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
