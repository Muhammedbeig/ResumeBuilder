"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, FileText, Target, Globe, BarChart3, Languages } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Rewrites',
    description: 'Transform your bullet points into compelling, achievement-focused statements with our intelligent AI that follows STAR methodology.',
    color: 'from-purple-500 to-violet-600'
  },
  {
    icon: FileText,
    title: 'ATS-Friendly Templates',
    description: 'Our templates are optimized to pass Applicant Tracking Systems. Clean, single-column layouts that recruiters love.',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: Target,
    title: 'Job Tailoring',
    description: 'Paste any job description and our AI will suggest keywords and rewrite your resume to match perfectly.',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: Globe,
    title: 'Professional Profile',
    description: 'Get a beautiful, shareable profile page that showcases your experience, skills, and projects in one place.',
    color: 'from-orange-500 to-amber-600'
  },
  {
    icon: Languages,
    title: 'Multi-Language Support',
    description: 'Create resumes in multiple languages including English and Urdu. Perfect for international opportunities.',
    color: 'from-pink-500 to-rose-600'
  },
  {
    icon: BarChart3,
    title: 'Recruiter Insights',
    description: 'Track views, downloads, and get analytics on your resume performance with built-in insights.',
    color: 'from-indigo-500 to-blue-600'
  }
];

export function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="features" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Everything You Need to 
            <span className="bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
              {' '}Land Your Dream Job
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Our comprehensive toolkit covers every aspect of resume building, from writing to optimization.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`group relative p-8 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 transition-all duration-500 ${
                  hoveredIndex !== null && hoveredIndex !== index 
                    ? 'opacity-60 scale-[0.98]' 
                    : 'opacity-100'
                }`}
              >
                {/* Hover glow effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                {/* Icon */}
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Decorative corner */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
