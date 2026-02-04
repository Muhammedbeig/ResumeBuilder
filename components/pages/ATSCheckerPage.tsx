"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, ArrowRight, Loader2, Sparkles, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { PlanChoiceModal } from "@/components/plan/PlanChoiceModal";
import { useSession } from "next-auth/react";

interface ATSAnalysis {
  score: number;
  summary: string;
  breakdown: {
    [key: string]: {
      score: number;
      feedback: string[];
    };
  };
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  formatting_issues: string[];
}

export function ATSCheckerPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const { planChoice } = usePlanChoice();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const isAuthenticated = !!session?.user;
  const shouldShowPlanModal = isAuthenticated && isPlanModalOpen;

  const openPlanModal = () => {
    if (!isAuthenticated) return;
    setIsPlanModalOpen(true);
  };

  useEffect(() => {
    if (planChoice) {
      setIsPlanModalOpen(false);
    }
  }, [planChoice]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!session?.user) {
      toast.error("Please sign in to use AI features");
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }
    if (!planChoice || planChoice !== "paid") {
      toast.info("AI features are available in the Paid plan.");
      openPlanModal();
      return;
    }
    if (!file) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/ai/ats-check", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setAnalysis(data);
      toast.success("Resume analyzed successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to analyze resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };
  
  const getProgressColor = (score: number) => {
      if (score >= 80) return "bg-green-500";
      if (score >= 60) return "bg-yellow-500";
      return "bg-red-500";
  };

  if (analysis) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <PlanChoiceModal open={shouldShowPlanModal} onOpenChange={setIsPlanModalOpen} />
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ATS Analysis Results</h1>
                    <p className="text-gray-500 dark:text-gray-400">Here is how your resume performs against Applicant Tracking Systems.</p>
                </div>
                 <Button onClick={() => setAnalysis(null)} variant="outline">Analyze Another</Button>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Score Card */}
            <Card className="lg:col-span-1 border-0 shadow-lg bg-white dark:bg-gray-800">
              <CardContent className="pt-8 flex flex-col items-center text-center">
                <div className="relative flex items-center justify-center w-48 h-48">
                   <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-200 dark:text-gray-700 stroke-current"
                        strokeWidth="8"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                      ></circle>
                      <circle
                        className={`${getScoreColor(analysis.score)} stroke-current transition-all duration-1000 ease-out`}
                        strokeWidth="8"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        strokeDasharray={`${analysis.score * 2.51} 251.2`}
                        transform="rotate(-90 50 50)"
                      ></circle>
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-5xl font-bold ${getScoreColor(analysis.score)}`}>{analysis.score}</span>
                      <span className="text-sm text-gray-500 uppercase tracking-wide mt-1">Overall Score</span>
                   </div>
                </div>
                <div className="mt-6 space-y-2">
                    <h3 className="font-semibold text-lg">Analysis Summary</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{analysis.summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Breakdown */}
            <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="breakdown" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
                        <TabsTrigger value="strengths">Strengths & Weaknesses</TabsTrigger>
                        <TabsTrigger value="keywords">Keywords & Formatting</TabsTrigger>
                    </TabsList>

                    <TabsContent value="breakdown" className="space-y-4 mt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {Object.entries(analysis.breakdown).map(([key, data]) => (
                                <Card key={key} className="border border-gray-200 dark:border-gray-700">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base capitalize flex justify-between">
                                            {key.replace('_', ' ')}
                                            <span className={`text-sm ${getScoreColor(data.score)}`}>{data.score}/100</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Progress value={data.score} className={`h-2 mb-3 ${getProgressColor(data.score)}`} />
                                        <ul className="space-y-1">
                                            {data.feedback.map((item, i) => (
                                                <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
                                                    <span className="mt-0.5 block w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="strengths" className="mt-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="border-green-100 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900">
                                <CardHeader>
                                    <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" /> Strengths
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {analysis.strengths.map((item, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900">
                                <CardHeader>
                                    <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" /> Weaknesses
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {analysis.weaknesses.map((item, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="keywords" className="mt-4">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-500" /> Missing Keywords
                                    </CardTitle>
                                    <CardDescription>
                                        Consider adding these keywords to improve your match rate for relevant roles.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.missing_keywords.map((keyword, i) => (
                                            <Badge 
                                              key={i} 
                                              variant="secondary" 
                                              className="bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 dark:hover:text-purple-100 transition-colors"
                                            >
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-500" /> Formatting Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                     <ul className="space-y-2">
                                        {analysis.formatting_issues.length > 0 ? analysis.formatting_issues.map((issue, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                                {issue}
                                            </li>
                                        )) : (
                                            <li className="flex gap-2 text-sm text-green-600 dark:text-green-400">
                                                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                No major formatting issues detected.
                                            </li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <PlanChoiceModal open={shouldShowPlanModal} onOpenChange={setIsPlanModalOpen} />
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
          >
            ATS Resume Checker
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Get a detailed analysis of your resume's compatibility with Applicant Tracking Systems. 
            Identify strengths, weaknesses, and missing keywords.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Upload Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer relative overflow-hidden group">
              <CardContent className="p-8 flex flex-col items-center text-center h-full justify-center space-y-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Resume</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Upload your existing resume (PDF) to get an instant AI-powered ATS score.
                  </p>
                </div>
                
                {isAnalyzing ? (
                    <Button disabled className="w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                    </Button>
                ) : (
                    <div className="w-full relative">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            {file ? file.name : "Select File"}
                        </Button>
                    </div>
                )}
                {file && !isAnalyzing && (
                    <Button onClick={handleUpload} className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white">
                        Analyze Now <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Create From Scratch Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/templates" className="block h-full">
                <Card className="h-full border-2 border-transparent bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8 flex flex-col items-center text-center h-full justify-center space-y-6">
                    <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FileUp className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create from Scratch</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Don't have a resume? Choose from our professional templates and build one that passes ATS.
                    </p>
                    </div>
                    <Button variant="outline" className="w-full group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/20 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 group-hover:border-cyan-200 dark:group-hover:border-cyan-800">
                        Choose Template <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </CardContent>
                </Card>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
