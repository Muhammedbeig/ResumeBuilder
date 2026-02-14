"use client";

import { Suspense, useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { resolveCoverLetterTemplateComponent, resolveCvTemplateComponent, resolveResumeTemplateComponent } from "@/lib/template-resolvers";
import type { CoverLetterTemplateConfig, CvTemplateConfig, ResumeTemplateConfig, TemplateType } from "@/lib/panel-templates";
import { previewResumeData } from "@/lib/resume-samples";
import { previewCoverLetterData } from "@/lib/template-preview-samples";

const DEFAULT_TEMPLATE_BY_TYPE: Record<TemplateType, string> = {
  resume: "modern",
  cv: "academic-cv",
  cover_letter: "modern",
};

function resolveTemplateType(raw: string | null): TemplateType {
  if (raw === "cv" || raw === "cover_letter") return raw;
  return "resume";
}

function parseConfig(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function PreviewFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-[960px] rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {children}
      </div>
    </main>
  );
}

function TemplatePreviewEmbedContent() {
  const searchParams = useSearchParams();

  const type = resolveTemplateType(searchParams.get("type"));
  const templateIdInput =
    searchParams.get("templateId") ?? searchParams.get("template_id") ?? "";
  const templateId = templateIdInput.trim() || DEFAULT_TEMPLATE_BY_TYPE[type];
  const renderEngine = (
    searchParams.get("renderEngine") ??
    searchParams.get("render_engine") ??
    ""
  )
    .trim()
    .toLowerCase();
  const config = useMemo(() => parseConfig(searchParams.get("config")), [searchParams]);
  const useConfig = renderEngine !== "static";

  if (type === "cover_letter") {
    const TemplateComponent = resolveCoverLetterTemplateComponent(
      templateId,
      (useConfig ? config : null) as CoverLetterTemplateConfig | null
    );

    return <PreviewFrame><TemplateComponent data={previewCoverLetterData} /></PreviewFrame>;
  }

  if (type === "cv") {
    const TemplateComponent = resolveCvTemplateComponent(
      templateId,
      (useConfig ? config : null) as CvTemplateConfig | null
    );

    return <PreviewFrame><TemplateComponent data={previewResumeData} /></PreviewFrame>;
  }

  const TemplateComponent = resolveResumeTemplateComponent(
    templateId,
    (useConfig ? config : null) as ResumeTemplateConfig | null
  );
  return <PreviewFrame><TemplateComponent data={previewResumeData} /></PreviewFrame>;
}

export default function TemplatePreviewEmbedPage() {
  return (
    <Suspense fallback={<PreviewFrame><div className="min-h-[320px]" /></PreviewFrame>}>
      <TemplatePreviewEmbedContent />
    </Suspense>
  );
}
