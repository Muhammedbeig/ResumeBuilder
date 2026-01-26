"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { UserPlus, PenTool, Target, Download, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: '01',
    title: 'Sign Up & Choose Template',
    description: 'Create your account in seconds and browse our collection of ATS-friendly templates. Pick the one that matches your style and industry.',
    features: ['30+ Professional Templates', 'ATS-Optimized Layouts', 'Industry-Specific Designs']
  },
  {
    icon: PenTool,
    number: '02',
    title: 'AI Helps You Write',
    description: 'Our AI analyzes your experience and suggests powerful, achievement-focused bullet points using proven frameworks like STAR and CAR.',
    features: ['Smart Bullet Rewrites', 'Summary Generator', 'Skill Suggestions']
  },
  {
    icon: Target,
    number: '03',
    title: 'Tailor to Any Job',
    description: 'Paste a job description and watch as our AI identifies missing keywords and rewrites your resume to match perfectly.',
    features: ['Keyword Gap Analysis', 'ATS Score Improvement', 'Custom Suggestions']
  },
  {
    icon: Download,
    number: '04',
    title: 'Export & Impress',
    description: 'Download your resume as a PDF or share your professional profile link. Start getting more interview calls!',
    features: ['High-Quality PDF Export', 'Shareable Profile Link', 'Real-time Analytics']
  }
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="how-it-works" ref={ref} className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Your Path to a 
            <span className="bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              {' '}Perfect Resume
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Get your dream job in 4 simple steps. Our AI does the heavy lifting so you can focus on what matters.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting Line - Desktop */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-b from-purple-500 via-cyan-500 to-purple-500"
              style={{ scaleY: pathLength, transformOrigin: "top" }}
            />
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;
            
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mb-16 last:mb-0 ${
                  isEven ? '' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${isEven ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div className={`space-y-4 ${isEven ? 'lg:ml-auto' : 'lg:mr-auto'} max-w-lg`}>
                    <span className="inline-block text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent opacity-30">
                      {step.number}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.features.map((feature, idx) => (
                        <li key={idx} className={`flex items-center gap-2 text-sm ${isEven ? 'lg:flex-row-reverse' : ''}`}>
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Icon Node */}
                <div className="relative flex-shrink-0">
                  {/* Pulse ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 opacity-20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  {/* Icon container */}
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Empty space for alignment */}
                <div className="flex-1 hidden lg:block" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
