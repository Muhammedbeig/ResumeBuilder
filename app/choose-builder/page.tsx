"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FileText, FileCode, Mail, Upload, Sparkles, ChevronRight, Zap, Target, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { useSession } from "next-auth/react";
import { PlanChoiceModal } from "@/components/plan/PlanChoiceModal";
import { useState } from "react";

export default function ChooseBuilderPage() {
  const { data: session } = useSession();
  const { planChoice } = usePlanChoice();
  const router = useRouter();
  const isAuthenticated = !!session?.user;
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
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

  const handleNavigate = (href: string) => {
    if (!ensurePlanChosen()) return;
    router.push(href);
  };

  const builders = [
    {
      title: "Resume",
      subtitle: "Professional",
      description: "Optimized for job applications and ATS systems.",
      icon: FileText,
      color: "from-purple-600 to-indigo-600",
      bgColor: "bg-purple-500",
      startHref: "/resume/new",
      importHref: "/resume/start",
      features: ["ATS Friendly", "Multi-column", "Modern Design"]
    },
    {
      title: "CV",
      subtitle: "Academic",
      description: "Detailed format for research and academic roles.",
      icon: FileCode,
      color: "from-cyan-600 to-blue-600",
      bgColor: "bg-cyan-500",
      startHref: "/cv/new",
      importHref: "/cv/start",
      features: ["Academic Ready", "Comprehensive", "Clean Layout"]
    },
    {
      title: "Cover Letter",
      subtitle: "Persuasive",
      description: "Introduce yourself with impact and professional style.",
      icon: Mail,
      color: "from-fuchsia-600 to-pink-600",
      bgColor: "bg-fuchsia-500",
      startHref: "/cover-letter/new",
      importHref: "/cover-letter/start",
      features: ["Personalized", "AI-Enhanced", "Job Targeted"]
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-24 bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
      <PlanChoiceModal open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen} />
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-semibold mb-6 border border-purple-200 dark:border-purple-800"
          >
            <Sparkles className="w-4 h-4" />
            <span>Select Your Tool</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight"
          >
            What are we <span className="bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent italic">building</span> today?
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Empower your career with professional documents crafted specifically for your goals.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {builders.map((builder, idx) => (
            <motion.div
              key={builder.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <Card className="h-full border-gray-200 dark:border-gray-800 overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl flex flex-col relative">
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${builder.color}`} />
                
                <div className="p-8 pb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${builder.color} flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform`}>
                    <builder.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-1 block">
                      {builder.subtitle}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{builder.title}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                    {builder.description}
                  </p>
                  
                  <div className="space-y-3 mb-8">
                    {builder.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                        <Zap className="w-3 h-3 text-amber-500" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                <CardContent className="p-8 pt-0 mt-auto space-y-4">
                  <Button
                    onClick={() => handleNavigate(builder.startHref)}
                    className={`w-full py-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl font-bold text-base shadow-xl transition-all group/btn`}
                  >
                    Start from Scratch
                    <ChevronRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                  
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-gray-200 dark:border-gray-800" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-gray-200 dark:border-gray-800" />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleNavigate(builder.importHref)}
                    className="w-full py-6 rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 font-bold transition-all"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Existing
                  </Button>

                  <p className="text-[10px] text-center text-amber-600 dark:text-amber-500 font-bold mt-4 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                    IMPORT REQUIRES LOGIN
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom Tip */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 flex justify-center"
        >
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm max-w-lg">
            <Target className="w-5 h-5 text-purple-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
              <span className="font-bold text-gray-900 dark:text-white italic text-xs">Expert Tip:</span> We recommend importing your latest document to save up to 15 minutes of typing.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
