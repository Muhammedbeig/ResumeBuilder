"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { useSession } from "next-auth/react";
import { PlanChoiceModal } from "@/components/plan/PlanChoiceModal";
import {
  RESUME_TEMPLATE_CATEGORIES,
  RESUME_TEMPLATE_CATALOG_BY_CATEGORY,
  RESUME_TEMPLATE_CATEGORY_SLUGS,
} from "@/lib/resume-template-catalog";
import { catalogTemplateMap } from "@/components/resume/templates/catalog";
import { previewResumeData } from "@/lib/resume-samples";

function RescaleContainer({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        const targetWidth = 918;
        const newScale = containerWidth / targetWidth;
        setScale(newScale);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[918/1188] bg-slate-900/50 rounded-t-xl overflow-hidden"
    >
      <div
        className="absolute top-0 left-0 origin-top-left shadow-2xl"
        style={{
          width: "918px",
          height: "1188px",
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
    </div>
  );
}

const resolveInitialCategory = (value?: string | null) => {
  if (!value) return null;
  return RESUME_TEMPLATE_CATEGORY_SLUGS.includes(value) ? value : null;
};

export function TemplatesCatalogPage({ initialCategory }: { initialCategory?: string | null }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { planChoice, isLoaded } = usePlanChoice();
  const isAuthenticated = !!session?.user;
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const forcePlanChoice = isAuthenticated && isLoaded && !planChoice;
  const shouldShowPlanModal = isAuthenticated && (forcePlanChoice || isPlanModalOpen);

  const categories = RESUME_TEMPLATE_CATEGORIES;
  const [activeCategory, setActiveCategory] = useState(
    resolveInitialCategory(initialCategory) || categories[0]?.slug || "professional"
  );
  const hasAutoScrolled = useRef(false);

  const templatesByCategory = useMemo(
    () => RESUME_TEMPLATE_CATALOG_BY_CATEGORY,
    []
  );

  const handleCategoryClick = (slug: string) => {
    const target = document.getElementById(slug);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActiveCategory(slug);
    router.replace(`/templates/${slug}`, { scroll: false });
  };

  useEffect(() => {
    const normalized = resolveInitialCategory(initialCategory);
    if (!normalized || hasAutoScrolled.current) return;
    const target = document.getElementById(normalized);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      hasAutoScrolled.current = true;
    }
  }, [initialCategory]);

  useEffect(() => {
    const sections = RESUME_TEMPLATE_CATEGORY_SLUGS.map((slug) =>
      document.getElementById(slug)
    ).filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const slug = visible.target.id;
        if (slug && slug !== activeCategory) {
          setActiveCategory(slug);
          router.replace(`/templates/${slug}`, { scroll: false });
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.4, 0.6],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [activeCategory, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16">
      <PlanChoiceModal
        open={shouldShowPlanModal}
        onOpenChange={setIsPlanModalOpen}
        forceChoice={forcePlanChoice}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-200 text-sm font-medium mb-6 border border-purple-500/30"
        >
          <Sparkles className="w-4 h-4" />
          <span>Resume Template Library</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Explore 40+ Modern Resume Templates
        </h1>
        <p className="text-base md:text-lg text-slate-300 max-w-3xl mx-auto">
          Each category includes a free, fully editable resume template with premium styling.
          Choose a category and start building in seconds.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => handleCategoryClick(category.slug)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition ${
                activeCategory === category.slug
                  ? "bg-gradient-to-r from-purple-600 to-cyan-500 border-transparent text-white"
                  : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-purple-400/50"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {categories.map((category, index) => {
          const templates = templatesByCategory[category.slug] || [];
          return (
            <section
              key={category.slug}
              id={category.slug}
              className="scroll-mt-28"
            >
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                    Category
                  </p>
                  <h2 className="text-2xl md:text-3xl font-semibold">{category.label}</h2>
                  <p className="text-slate-400 mt-2 max-w-2xl">{category.description}</p>
                </div>
                <Link href={`/templates/${category.slug}`}>
                  <Button variant="outline" className="border-slate-700 text-slate-200">
                    Share Category
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map((template, templateIndex) => {
                  const TemplateComponent = catalogTemplateMap[template.id];
                  if (!TemplateComponent) return null;
                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index + templateIndex) * 0.05 }}
                      className="group relative bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-lg"
                    >
                      <div className="relative p-4 pb-0 bg-slate-900/30 rounded-t-2xl">
                        <RescaleContainer>
                          <TemplateComponent data={previewResumeData} />
                        </RescaleContainer>
                        <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-t-2xl">
                          <Link href={`/resume/new?template=${template.id}`}>
                            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-200 font-semibold">
                              Use This Template
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{template.name}</h3>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-300">
                            Free
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                          {template.description}
                        </p>

                        <div className="mt-auto pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>ATS Friendly - Fully Editable</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 text-center">
        <div className="bg-gradient-to-r from-purple-600 to-cyan-500 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to build your resume?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Start with any category template and customize every detail in the editor.
          </p>
          <Link href="/resume/new">
            <Button size="lg" variant="secondary" className="gap-2">
              Create My Resume <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
