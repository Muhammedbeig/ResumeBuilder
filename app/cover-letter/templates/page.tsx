"use client";

import React, { useRef, useState, useEffect, type ComponentType } from 'react';
import { useRouter } from "next/navigation";
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coverLetterTemplates } from '@/lib/cover-letter-templates';
import { fetchTemplates } from '@/lib/template-client';
import { resolveCoverLetterTemplateComponent } from '@/lib/template-resolvers';
import type { CoverLetterTemplateConfig } from '@/lib/panel-templates';
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { useSession } from "next-auth/react";
import { PlanChoiceModal } from "@/components/plan/PlanChoiceModal";

type TemplateOption = {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  component: ComponentType<{ data: any }>;
};

// Using a placeholder data for previews
const previewData = {
  personalInfo: {
    fullName: "Alex Morgan",
    email: "alex.morgan@example.com",
    phone: "(555) 123-4567",
    address: "123 Innovation Dr",
    city: "San Francisco",
    zipCode: "94103",
  },
  recipientInfo: {
    managerName: "Sarah Connor",
    companyName: "TechCorp Inc.",
    address: "456 Future Way",
    city: "San Francisco",
    zipCode: "94105",
    email: "hiring@techcorp.com",
  },
  content: {
    subject: "Application for Senior Developer Position",
    greeting: "Dear Ms. Connor,",
    opening: "I am writing to express my strong interest in the Senior Developer position at TechCorp Inc.",
    body: "With over 5 years of experience in full-stack development, I have a proven track record of delivering scalable web applications. I was particularly impressed by TechCorp's recent work on AI-driven analytics, and I believe my background in machine learning integration would be a valuable asset to your team.",
    closing: "Thank you for considering my application. I look forward to the possibility of discussing how I can contribute to your team's success.",
    signature: "Alex Morgan",
  },
};

function RescaleContainer({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        const targetWidth = 800; // Standard A4 width approx
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
      className="relative w-full aspect-[210/297] bg-gray-100 dark:bg-gray-800 rounded-t-xl overflow-hidden"
    >
      <div 
        className="absolute top-0 left-0 origin-top-left shadow-2xl bg-white"
        style={{
          width: '800px',
          height: '1131px', 
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-gray-50 dark:from-gray-900/50 to-transparent pointer-events-none" />
    </div>
  );
}

export default function CoverLetterTemplatesPage() {
  const { data: session } = useSession();
  const { planChoice } = usePlanChoice();
  const isAuthenticated = !!session?.user;
  const router = useRouter();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateOption[]>(coverLetterTemplates);
  const openPlanModal = () => {
    if (!isAuthenticated) return;
    setIsPlanModalOpen(true);
  };

  const ensurePlanChosen = () => {
    if (!isAuthenticated) return true;
    if (!planChoice) {
      openPlanModal();
      return false;
    }
    return true;
  };

  useEffect(() => {
    let isActive = true;

    const loadTemplates = async () => {
      const panelTemplates = await fetchTemplates("cover_letter", { active: true });
      if (!panelTemplates.length || !isActive) return;

      const mapped: TemplateOption[] = panelTemplates.map((template) => ({
        id: template.template_id,
        name: template.name || template.template_id,
        description: template.description || "",
        premium: template.is_premium,
        component: resolveCoverLetterTemplateComponent(
          template.template_id,
          template.config as CoverLetterTemplateConfig
        ),
      }));

      if (isActive) setTemplates(mapped);
    };

    loadTemplates();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <PlanChoiceModal open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen} />
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-sm font-medium mb-6"
        >
          <Sparkles className="w-4 h-4" />
          <span>Professional Cover Letter Templates</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Make a Great <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-500">First Impression</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose from our collection of professionally designed cover letter templates.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template, index) => {
            const TemplateComponent = template.component;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                {/* Preview Container */}
                <div className="relative p-4 pb-0 bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl">
                  <RescaleContainer>
                    <TemplateComponent data={previewData} />
                  </RescaleContainer>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-t-2xl z-10">
                    <Button
                      size="lg"
                      className="bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-xl scale-105"
                      onClick={() => {
                        if (!ensurePlanChosen()) return;
                        router.push(`/cover-letter/new?template=${template.id}`);
                      }}
                    >
                      Use This Template
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    {template.premium ? (
                       <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                         <Crown className="w-3 h-3" />
                         Premium
                       </span>
                    ) : (
                       <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                         Free
                       </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
