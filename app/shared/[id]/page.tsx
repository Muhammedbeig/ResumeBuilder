import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { panelInternalGet } from "@/lib/panel-internal-api";
import { panelGet } from "@/lib/panel-api";
import { resolveCvTemplateComponent, resolveResumeTemplateComponent } from "@/lib/template-resolvers";
import type { PanelTemplate } from "@/lib/panel-templates";
import { normalizeResumeData } from "@/lib/resume-data";
import { ResumeData } from "@/types";

interface SharedResumePageProps {
  params: Promise<{ id: string }>;
}

type SharedInternalResponse = {
  docType: "resume" | "cv";
  doc: {
    id: string;
    template: string;
  };
  latestVersionJson: Partial<ResumeData>;
};

export default async function SharedResumePage({ params }: SharedResumePageProps) {
  const { id } = await params;

  let shared: SharedInternalResponse | null = null;
  try {
    shared = await panelInternalGet<SharedInternalResponse>(`shared/${id}`);
  } catch {
    shared = null;
  }

  if (!shared?.doc || !shared?.latestVersionJson) {
    notFound();
  }

  const docType = shared.docType;
  const doc = shared.doc;
  const resumeData = normalizeResumeData(shared.latestVersionJson as Partial<ResumeData>);

  const fetchPanelTemplate = async (type: "resume" | "cv", templateId: string) => {
    try {
      const res = await panelGet<PanelTemplate>(`templates/${templateId}`, { type });
      return res.data ?? null;
    } catch {
      return null;
    }
  };

  let TemplateComponent =
    docType === "resume"
      ? resolveResumeTemplateComponent(doc.template, undefined)
      : resolveCvTemplateComponent(doc.template, undefined);

  if (docType === "resume") {
    const panelTemplate = await fetchPanelTemplate("resume", doc.template);
    TemplateComponent = resolveResumeTemplateComponent(doc.template, (panelTemplate?.config as any) ?? undefined);
  }

  if (docType === "cv") {
    const panelTemplate = await fetchPanelTemplate("cv", doc.template);
    TemplateComponent = resolveCvTemplateComponent(doc.template, (panelTemplate?.config as any) ?? undefined);
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
          ResuPro
        </Link>
        <Link href="/">
          <Button variant="outline">Create Your Own {docType === "resume" ? "Resume" : "CV"}</Button>
        </Link>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
        <TemplateComponent data={resumeData} />
      </div>

      <div className="max-w-4xl mx-auto mt-8 text-center text-sm text-gray-500">Generated with ResuPro AI Builder</div>
    </div>
  );
}
