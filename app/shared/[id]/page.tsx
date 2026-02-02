import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resumeTemplateMap } from "@/lib/resume-templates";
import { normalizeResumeData } from "@/lib/resume-data";
import { ResumeData } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Download } from "lucide-react";

interface SharedResumePageProps {
  params: Promise<{ id: string }>;
}

export default async function SharedResumePage({ params }: SharedResumePageProps) {
  const { id } = await params;

  const resume = await prisma.resume.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!resume || resume.versions.length === 0) {
    notFound();
  }

  const latestVersion = resume.versions[0];
  const resumeData = normalizeResumeData(latestVersion.jsonData as unknown as Partial<ResumeData>);
  const TemplateComponent = resumeTemplateMap[resume.template as keyof typeof resumeTemplateMap] || resumeTemplateMap.modern;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
          ResuPra
        </Link>
        <Link href="/">
            <Button variant="outline">Create Your Own Resume</Button>
        </Link>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
        <TemplateComponent data={resumeData} />
      </div>

      <div className="max-w-4xl mx-auto mt-8 text-center text-sm text-gray-500">
        Generated with ResuPra AI Resume Builder
      </div>
    </div>
  );
}
