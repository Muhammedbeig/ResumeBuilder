import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeResumeData } from "@/lib/resume-data";
import type { Prisma } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ resumes });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title : "Untitled Resume";
  const template = typeof body?.template === "string" ? body.template : "modern";
  const resumeData = normalizeResumeData(body?.data);
  const source = typeof body?.source === "string" ? body.source : "manual";

  const result = await prisma.$transaction(async (tx) => {
    const resume = await tx.resume.create({
      data: {
        userId,
        title,
        template,
      },
    });

    const version = await tx.resumeVersion.create({
      data: {
        resumeId: resume.id,
        jsonData: resumeData as unknown as Prisma.InputJsonValue,
        source,
      },
    });

    const updated = await tx.resume.update({
      where: { id: resume.id },
      data: { activeVersionId: version.id },
    });

    return { resume: updated, data: resumeData };
  });

  return NextResponse.json(result);
}
