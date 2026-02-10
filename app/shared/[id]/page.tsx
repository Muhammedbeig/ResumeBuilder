import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { panelGet } from "@/lib/panel-api";
import { resolveResumeTemplateComponent, resolveCvTemplateComponent } from "@/lib/template-resolvers";
import type { PanelTemplate } from "@/lib/panel-templates";
import { normalizeResumeData } from "@/lib/resume-data";
import { ResumeData } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SharedResumePageProps {
  params: Promise<{ id: string }>;
}

export default async function SharedResumePage({ params }: SharedResumePageProps) {
  const { id } = await params;

  // Try finding a resume first
  let doc: any = await prisma.resume.findFirst({
    where: {
      OR: [
        { id },
        { shortId: id }
      ]
    },
    include: {
      versions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  let docType = 'resume';

  if (!doc) {
    // Try finding a CV
    doc = await prisma.cv.findFirst({
      where: {
        OR: [
          { id },
          { shortId: id }
        ]
      },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    docType = 'cv';
  }

  if (!doc || doc.versions.length === 0) {
    notFound();
  }

  const latestVersion = doc.versions[0];
  const resumeData = normalizeResumeData(latestVersion.jsonData as unknown as Partial<ResumeData>);

  const fetchPanelTemplate = async (type: "resume" | "cv", templateId: string) => {
    try {
      const res = await panelGet<PanelTemplate>(`templates/${templateId}`, { type });
      return res.data ?? null;
    } catch {
      return null;
    }
  };

  let TemplateComponent = docType === "resume"
    ? resolveResumeTemplateComponent(doc.template, undefined)
    : resolveCvTemplateComponent(doc.template, undefined);

  if (docType === "resume") {
    const panelTemplate = await fetchPanelTemplate("resume", doc.template);
    TemplateComponent = resolveResumeTemplateComponent(
      doc.template,
      (panelTemplate?.config as any) ?? undefined
    );
  }

  if (docType === "cv") {
    const panelTemplate = await fetchPanelTemplate("cv", doc.template);
    TemplateComponent = resolveCvTemplateComponent(
      doc.template,
      (panelTemplate?.config as any) ?? undefined
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
          ResuPro
        </Link>
        <Link href="/">
            <Button variant="outline">Create Your Own {docType === 'resume' ? 'Resume' : 'CV'}</Button>
        </Link>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
        <TemplateComponent data={resumeData} />
      </div>

      <div className="max-w-4xl mx-auto mt-8 text-center text-sm text-gray-500">
        Generated with ResuPro AI Builder
      </div>
    </div>
  );
}
