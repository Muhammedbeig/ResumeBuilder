"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResume } from "@/contexts/ResumeContext";

type ReportPayload = {
  summary?: string;
  salaryBenchmark?: { range?: string; notes?: string };
  skillDemand?: {
    increasing?: string[];
    decreasing?: string[];
    emerging?: string[];
  };
  competitivePositioning?: {
    strengths?: string[];
    gaps?: string[];
    peerComparison?: string;
  };
  trendIdentification?: { market?: string; signals?: string[] };
  recommendedActions?: string[];
};

export default function CareerManagementPage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const { resumes } = useResume();
  const [source, setSource] = useState<"resume" | "upload">("resume");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [location, setLocation] = useState("");
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [periodLabel, setPeriodLabel] = useState<string>("");
  const [serverSubscription, setServerSubscription] = useState<{
    subscriptionPlanId: string | null;
    subscription: string | null;
  } | null>(null);
  const [isCheckingPlan, setIsCheckingPlan] = useState(true);

  useEffect(() => {
    let active = true;
    const loadSubscription = async () => {
      try {
        const res = await fetch("/api/user/subscription");
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (!active) return;
        setServerSubscription({
          subscriptionPlanId: data?.subscriptionPlanId ?? null,
          subscription: data?.subscription ?? null,
        });

        if (updateSession && session?.user) {
          const nextPlanId = data?.subscriptionPlanId ?? null;
          const nextSub = data?.subscription ?? null;
          if (
            nextPlanId !== session.user.subscriptionPlanId ||
            nextSub !== session.user.subscription
          ) {
            await updateSession({
              subscriptionPlanId: nextPlanId,
              subscription: nextSub,
            });
          }
        }
      } catch {
        // ignore
      } finally {
        if (!active) return;
        setIsCheckingPlan(false);
      }
    };
    loadSubscription();
    return () => {
      active = false;
    };
  }, [updateSession, session?.user]);

  const hasAnnualAccess = useMemo(() => {
    const planId =
      serverSubscription?.subscriptionPlanId ?? session?.user?.subscriptionPlanId;
    const subscription =
      serverSubscription?.subscription ?? session?.user?.subscription;
    return planId === "annual" || subscription === "business";
  }, [
    serverSubscription?.subscriptionPlanId,
    serverSubscription?.subscription,
    session?.user?.subscriptionPlanId,
    session?.user?.subscription,
  ]);

  useEffect(() => {
    if (!selectedResumeId && resumes.length > 0) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes, selectedResumeId]);

  const fetchResumeJson = async (resumeId: string) => {
    const response = await fetch(`/api/resumes/${resumeId}`);
    if (!response.ok) {
      throw new Error("Failed to load resume");
    }
    const data = await response.json();
    return data?.data;
  };

  const parseResumeFromFile = async (fileToParse: File) => {
    const formData = new FormData();
    formData.append("file", fileToParse);
    const extractRes = await fetch("/api/extract-pdf-text", {
      method: "POST",
      body: formData,
    });
    if (!extractRes.ok) {
      throw new Error("Failed to extract text from PDF");
    }
    const extractData = await extractRes.json();
    if (!extractData?.text) {
      throw new Error("No text found in PDF");
    }

    const parseRes = await fetch("/api/ai/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: extractData.text }),
    });
    if (!parseRes.ok) {
      const errorData = await parseRes.json().catch(() => ({}));
      throw new Error(errorData?.error || "Failed to parse resume");
    }
    const parsed = await parseRes.json();
    return parsed?.data;
  };

  const handleGenerate = async () => {
    if (!session?.user) {
      toast.info("Please sign in to use Career Management");
      router.push("/login?callbackUrl=/career-management");
      return;
    }

    if (!hasAnnualAccess) {
      toast.info("Career Management is available in the Annual plan.");
      router.push("/pricing");
      return;
    }

    setIsGenerating(true);
    setReport(null);
    try {
      let resumeJson;
      let resumeId: string | null = null;
      let sourceValue: "resume" | "upload" = source;

      if (source === "resume") {
        if (!selectedResumeId) {
          throw new Error("Please select a resume");
        }
        resumeId = selectedResumeId;
        resumeJson = await fetchResumeJson(selectedResumeId);
      } else {
        if (!file) {
          throw new Error("Please upload a PDF");
        }
        resumeJson = await parseResumeFromFile(file);
      }

      if (!resumeJson) {
        throw new Error("Resume data not found");
      }

      const response = await fetch("/api/market-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeJson,
          resumeId,
          source: sourceValue,
          targetRole,
          location,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || "Failed to generate report");
      }

      const data = await response.json();
      const reportData = data?.report?.reportJson || null;
      setReport(reportData);
      setPeriodLabel(data?.report?.periodLabel || "");
      toast.success("Report generated and saved to Analytics");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate report";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isCheckingPlan) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur">
            <CardContent className="py-12 text-center text-gray-500">
              Checking your plan...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasAnnualAccess) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur">
            <CardContent className="py-12 text-center space-y-4">
              <div className="mx-auto w-fit rounded-full px-4 py-1 text-xs uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                Annual Plan Feature
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Career Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Quarterly Market Value reports are available on the Annual plan.
              </p>
              <Button
                onClick={() => router.push("/pricing")}
                className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
              >
                View Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-4 py-1 text-xs uppercase tracking-wider">
            Annual Plan
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Career Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            Generate your Quarterly Market Value report to track salary trends, skill demand, and competitive positioning.
          </p>
        </div>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Import Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={source} onValueChange={(value) => setSource(value as "resume" | "upload")}>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="resume">Existing Resume</TabsTrigger>
                <TabsTrigger value="upload">Upload PDF</TabsTrigger>
              </TabsList>
              <TabsContent value="resume" className="space-y-4">
                <Label>Select a resume</Label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  <SelectTrigger className="bg-white/70 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800">
                    <SelectValue placeholder="Choose a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              <TabsContent value="upload" className="space-y-4">
                <Label htmlFor="resume-upload">Upload PDF</Label>
                <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 bg-white/60 dark:bg-gray-900/40">
                  <Input
                    id="resume-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {file ? file.name : "Choose a PDF to upload"}
                      </p>
                      <p className="text-xs text-gray-500">PDF only • Max 10MB</p>
                    </div>
                    <Label
                      htmlFor="resume-upload"
                      className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-cyan-600 cursor-pointer"
                    >
                      Browse File
                    </Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target-role">Target Role (optional)</Label>
                <Input
                  id="target-role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Senior Product Designer"
                  className="bg-white/70 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., New York, Remote"
                  className="bg-white/70 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800"
                />
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
            >
              {isGenerating ? "Generating..." : "Generate Report"}
            </Button>
          </CardContent>
        </Card>

        {report && (
          <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Quarterly Market Value Report {periodLabel ? `(${periodLabel})` : ""}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {report.summary && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h3>
                  <p className="text-gray-600 dark:text-gray-400">{report.summary}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-900/40">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Salary Benchmark</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {report.salaryBenchmark?.range || "Not available"}
                  </p>
                  {report.salaryBenchmark?.notes && (
                    <p className="text-sm text-gray-500 mt-2">{report.salaryBenchmark.notes}</p>
                  )}
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-900/40">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Market Trend</h3>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">
                    {report.trendIdentification?.market || "neutral"}
                  </p>
                  {report.trendIdentification?.signals && (
                    <ul className="text-sm text-gray-500 mt-2 list-disc list-inside space-y-1">
                      {report.trendIdentification.signals.map((signal, idx) => (
                        <li key={`${signal}-${idx}`}>{signal}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-900/40">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Skill Demand</h3>
                  <div className="text-sm text-gray-500 space-y-2">
                    <p>Increasing: {(report.skillDemand?.increasing || []).join(", ") || "N/A"}</p>
                    <p>Emerging: {(report.skillDemand?.emerging || []).join(", ") || "N/A"}</p>
                    <p>Decreasing: {(report.skillDemand?.decreasing || []).join(", ") || "N/A"}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-900/40">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Competitive Positioning</h3>
                  <div className="text-sm text-gray-500 space-y-2">
                    <p>Strengths: {(report.competitivePositioning?.strengths || []).join(", ") || "N/A"}</p>
                    <p>Gaps: {(report.competitivePositioning?.gaps || []).join(", ") || "N/A"}</p>
                    {report.competitivePositioning?.peerComparison && (
                      <p>{report.competitivePositioning.peerComparison}</p>
                    )}
                  </div>
                </div>
              </div>

              {report.recommendedActions && report.recommendedActions.length > 0 && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-900/40">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Recommended Actions</h3>
                  <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                    {report.recommendedActions.map((action, idx) => (
                      <li key={`${action}-${idx}`}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
