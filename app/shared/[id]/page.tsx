import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resumeTemplateMap } from "@/lib/resume-templates";
import { cvTemplateMap } from "@/lib/cv-templates";
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
  
  const TemplateComponent = docType === 'resume'
    ? (resumeTemplateMap[doc.template as keyof typeof resumeTemplateMap] || resumeTemplateMap.modern)
    : (cvTemplateMap[doc.template as keyof typeof cvTemplateMap] || (cvTemplateMap as any)["academic-cv"]);

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
