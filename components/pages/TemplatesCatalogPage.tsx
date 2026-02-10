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
} from "@/lib/resume-template-catalog";
import type { ResumeTemplateCatalogEntry, ResumeTemplateCategory } from "@/lib/resume-template-catalog";
import { CatalogTemplate } from "@/components/resume/templates/catalog/CatalogTemplate";
import { fetchTemplateCategories, fetchTemplates } from "@/lib/template-client";
import { normalizeResumeConfig, type PanelTemplate } from "@/lib/panel-templates";
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
      className="relative w-full aspect-[918/1188] bg-slate-50 rounded-t-xl overflow-hidden dark:bg-slate-900/50"
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
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white/80 to-transparent pointer-events-none dark:from-slate-950/80" />
    </div>
  );
}

const resolveInitialCategory = (value: string | null | undefined, slugs: string[]) => {
  if (!value) return null;
  if (value === "all") return "all";
  return slugs.includes(value) ? value : null;
};

export function TemplatesCatalogPage({ initialCategory }: { initialCategory?: string | null }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { planChoice, isLoaded } = usePlanChoice();
  const isAuthenticated = !!session?.user;
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const forcePlanChoice = isAuthenticated && isLoaded && !planChoice;
  const shouldShowPlanModal = isAuthenticated && (forcePlanChoice || isPlanModalOpen);

  const [categoryOptions, setCategoryOptions] = useState<ResumeTemplateCategory[]>(
    RESUME_TEMPLATE_CATEGORIES
  );
  const [templatesByCategory, setTemplatesByCategory] = useState<
    Record<string, ResumeTemplateCatalogEntry[]>
  >(RESUME_TEMPLATE_CATALOG_BY_CATEGORY);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = useMemo(
    () => [{ slug: "all", label: "All", description: "" }, ...categoryOptions],
    [categoryOptions]
  );

  useEffect(() => {
    let isActive = true;

    const loadPanelTemplates = async () => {
      const [panelCategories, panelTemplates] = await Promise.all([
        fetchTemplateCategories("resume"),
        fetchTemplates("resume", { active: true }),
      ]);

      const resolvedCategories =
        panelCategories.length > 0
          ? panelCategories.map((cat) => ({
              slug: cat.slug,
              label: cat.label,
              description: cat.description ?? "",
            }))
          : RESUME_TEMPLATE_CATEGORIES;

      const mappedTemplates = panelTemplates
        .map((template: PanelTemplate) => {
          const config = normalizeResumeConfig(
            template.config as ResumeTemplateCatalogEntry,
            template.template_id
          );
          if (!config) return null;
          return {
            ...config,
            id: template.template_id,
            name: template.name || config.name,
            description: template.description || config.description,
            category: template.category?.slug || config.category,
          } as ResumeTemplateCatalogEntry;
        })
        .filter(Boolean) as ResumeTemplateCatalogEntry[];

      const grouped: Record<string, ResumeTemplateCatalogEntry[]> = {};
      const sourceTemplates =
        mappedTemplates.length > 0 ? mappedTemplates : Object.values(RESUME_TEMPLATE_CATALOG_BY_CATEGORY).flat();

      for (const template of sourceTemplates) {
        if (!grouped[template.category]) grouped[template.category] = [];
        grouped[template.category].push(template);
      }

      if (!isActive) return;
      setCategoryOptions(resolvedCategories);
      setTemplatesByCategory(grouped);
    };

    loadPanelTemplates();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const slugs = categories.map((category) => category.slug);
    const resolved = resolveInitialCategory(initialCategory, slugs) || "all";
    setActiveCategory(resolved);
  }, [initialCategory, categories]);

  const handleCategoryClick = (slug: string) => {
    setActiveCategory(slug);
    if (slug === "all") {
      router.replace(`/templates`, { scroll: false });
    } else {
      router.replace(`/templates/${slug}`, { scroll: false });
    }
  };

  const templates = useMemo(() => {
    if (activeCategory === "all") {
      return Object.values(templatesByCategory).flat();
    }
    return templatesByCategory[activeCategory] || [];
  }, [activeCategory, templatesByCategory]);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white pt-24 pb-16">
      <PlanChoiceModal
        open={shouldShowPlanModal}
        onOpenChange={setIsPlanModalOpen}
        forceChoice={forcePlanChoice}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-200 text-sm font-medium mb-6 border border-purple-500/30"
        >
          <Sparkles className="w-4 h-4" />
          <span>Resume Template Library</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Explore 40+ Modern Resume Templates
        </h1>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
          Browse 40+ modern resume templates and start building in seconds.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => handleCategoryClick(category.slug)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition ${
                activeCategory === category.slug
                  ? "bg-gradient-to-r from-purple-600 to-cyan-500 border-transparent text-white"
                  : "bg-white/90 border-slate-200 text-slate-600 hover:border-purple-400/50 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template, index) => {
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-lg dark:bg-slate-900/70 dark:border-slate-800"
              >
                <div className="relative p-4 pb-0 bg-slate-50 rounded-t-2xl dark:bg-slate-900/30">
                  <RescaleContainer>
                    <CatalogTemplate data={previewResumeData} config={template} />
                  </RescaleContainer>
                  <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-t-2xl dark:bg-slate-950/70">
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
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      Free
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span>ATS Friendly - Fully Editable</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
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
