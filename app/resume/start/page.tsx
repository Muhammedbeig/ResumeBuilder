"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FileUp, Plus, Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useResume } from "@/contexts/ResumeContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { PlanChoiceModal } from "@/components/plan/PlanChoiceModal";

export default function StartResumePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { setImportedData } = useResume();
  const { planChoice } = usePlanChoice();
  const [isUploading, setIsUploading] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const isAuthenticated = !!session?.user;
  const shouldShowPlanModal = isAuthenticated && isPlanModalOpen;

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

  const ensurePaidPlan = () => {
    if (!ensurePlanChosen()) return false;
    if (planChoice !== "paid") {
      toast.info("AI features are available in the Paid plan.");
      openPlanModal();
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (planChoice) {
      setIsPlanModalOpen(false);
    }
  }, [planChoice]);

  const handleStartFresh = () => {
    if (!ensurePlanChosen()) return;
    setImportedData(null);
    router.push("/resume/new");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!session?.user) {
      toast.error("Please sign in to use the AI import feature");
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }
    if (!ensurePaidPlan()) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Analyzing your Resume...");

    try {
      // 1. Extract text from PDF
      const formData = new FormData();
      formData.append("file", file);

      const extractRes = await fetch("/api/extract-pdf-text", {
        method: "POST",
        body: formData,
      });

      if (!extractRes.ok) throw new Error("Failed to read PDF file");
      const { text } = await extractRes.json();

      if (!text) throw new Error("Could not extract text from PDF");

      // 2. Parse text with AI
      const parseRes = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!parseRes.ok) {
        if (parseRes.status === 402) {
          toast.error("AI limit has done", { id: toastId });
          return;
        }
        if (parseRes.status === 401) {
          toast.error("Please sign in to use the AI import feature", { id: toastId });
          router.push(`/login?callbackUrl=${window.location.pathname}`);
          return;
        }
        throw new Error("Failed to parse Resume data");
      }
      const { data } = await parseRes.json();

      // 3. Store data and redirect
      setImportedData(data);
      toast.success("Resume imported successfully!", { id: toastId });
      router.push("/resume/new");
    } catch (error) {
      console.error(error);
      toast.error("Failed to process Resume. Please try again or start from scratch.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50 dark:bg-gray-950">
      <PlanChoiceModal open={shouldShowPlanModal} onOpenChange={setIsPlanModalOpen} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How would you like to start?
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Choose to start with a blank canvas or import your existing resume to get a head start.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create from Scratch */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-full"
          >
            <Card className="h-full cursor-pointer hover:border-purple-500 transition-colors" onClick={handleStartFresh}>
              <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Plus className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Create from Scratch
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a professional template and build your Resume section by section.
                  </p>
                </div>
                <Button variant="outline" className="w-full">
                  Start Fresh
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Import Resume */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-full relative"
          >
            <div className="absolute -top-3 left-0 right-0 flex justify-center gap-2 z-10">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Recommended
              </span>
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                100% Precision
              </span>
            </div>
            <Card className="h-full cursor-pointer hover:border-cyan-500 transition-colors border-2 border-purple-500/20 dark:border-purple-500/30">
              <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 pt-10">
                <div className="w-20 h-20 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 text-cyan-600 dark:text-cyan-400 animate-spin" />
                  ) : (
                    <FileUp className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Import Existing Resume
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload your current PDF resume and let AI extract your information automatically.
                  </p>
                </div>
                <div className="relative w-full">
                  <Button variant="outline" className="w-full" disabled={isUploading}>
                    {isUploading ? "Processing..." : "Upload PDF"}
                  </Button>
                  <input
                    type="file"
                    accept=".pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
