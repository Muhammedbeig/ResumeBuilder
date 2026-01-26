"use client";

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resumeTemplates } from '@/lib/resume-templates';
import { previewResumeData } from '@/lib/resume-samples';

function RescaleContainer({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        // Standard A4 width at 96 DPI is approx 794px
        const targetWidth = 794; 
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
      className="relative w-full aspect-[210/160] bg-gray-100 dark:bg-gray-800 rounded-t-xl overflow-hidden"
    >
      <div 
        className="absolute top-0 left-0 origin-top-left shadow-2xl bg-white"
        style={{
          width: '794px',
          height: '1123px', // Keep full height internally so layout doesn't break
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
      {/* Fade effect at the bottom to show it's a preview */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-gray-50 dark:from-gray-900/50 to-transparent pointer-events-none" />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-sm font-medium mb-6"
        >
          <Sparkles className="w-4 h-4" />
          <span>Professional Resume Templates</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Stand Out with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-500">Premium Designs</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose from our collection of ATS-friendly and creative templates. 
          Tested by recruiters and optimized for landing interviews.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resumeTemplates.map((template, index) => {
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
                    <TemplateComponent data={previewResumeData} />
                  </RescaleContainer>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-t-2xl z-10">
                    <Link href={`/resume/new?template=${template.id}`}>
                      <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-xl scale-105">
                        Use This Template
                      </Button>
                    </Link>
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
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>ATS Friendly</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 text-center">
        <div className="bg-gradient-to-r from-purple-600 to-cyan-500 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to build your resume?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Join thousands of job seekers who have successfully landed jobs at top companies.
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
