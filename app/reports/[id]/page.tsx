"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const reportId = params?.id as string;

  useEffect(() => {
    if (!reportId) return;
    let active = true;
    setLoading(true);
    fetch(`/api/market-value/${reportId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (!active) return;
        setReport(data?.report ?? null);
      })
      .catch(() => {
        if (!active) return;
        setReport(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reportId]);

  const reportJson = useMemo<ReportPayload | null>(() => {
    if (!report?.reportJson) return null;
    return report.reportJson as ReportPayload;
  }, [report]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-6">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur">
            <CardContent className="py-12 text-center text-gray-500">
              Loading report...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!report || !reportJson) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-6 space-y-6">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur">
            <CardContent className="py-12 text-center space-y-4">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Report not found</h1>
              <p className="text-gray-600 dark:text-gray-400">
                We couldn't load this report. It may have been removed.
              </p>
              <Button onClick={() => router.push("/dashboard")} className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const salaryRange = reportJson.salaryBenchmark?.range || "Not available";
  const market = reportJson.trendIdentification?.market || "neutral";

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-4 py-1 text-xs uppercase tracking-wider">
              Quarterly Report
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Market Value Report {report.periodLabel ? `(${report.periodLabel})` : ""}
            </h1>
            <p className="text-sm text-gray-500">
              Created {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="capitalize bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              {market}
            </Badge>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="border-gray-300 dark:border-gray-700"
            >
              Back to Reports
            </Button>
          </div>
        </div>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {reportJson.summary || "No summary provided."}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Salary Benchmark</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">{salaryRange}</p>
              {reportJson.salaryBenchmark?.notes && (
                <p className="text-sm text-gray-500">{reportJson.salaryBenchmark.notes}</p>
              )}
            </CardContent>
          </Card>
          <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Market Trend Signals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportJson.trendIdentification?.signals && reportJson.trendIdentification.signals.length > 0 ? (
                <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                  {reportJson.trendIdentification.signals.map((signal, idx) => (
                    <li key={`${signal}-${idx}`}>{signal}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No signals available.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Skill Demand</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>Increasing: {(reportJson.skillDemand?.increasing || []).join(", ") || "N/A"}</p>
              <p>Emerging: {(reportJson.skillDemand?.emerging || []).join(", ") || "N/A"}</p>
              <p>Decreasing: {(reportJson.skillDemand?.decreasing || []).join(", ") || "N/A"}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Competitive Positioning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Strengths: {(reportJson.competitivePositioning?.strengths || []).join(", ") || "N/A"}</p>
              <p>Gaps: {(reportJson.competitivePositioning?.gaps || []).join(", ") || "N/A"}</p>
              {reportJson.competitivePositioning?.peerComparison && (
                <p>{reportJson.competitivePositioning.peerComparison}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reportJson.recommendedActions && reportJson.recommendedActions.length > 0 ? (
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                {reportJson.recommendedActions.map((action, idx) => (
                  <li key={`${action}-${idx}`}>{action}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No recommendations available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
