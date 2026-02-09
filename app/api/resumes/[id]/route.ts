import { json } from "@/lib/json";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeResumeData } from "@/lib/resume-data";
import { parseUserIdBigInt } from "@/lib/user-id";
import type { Prisma } from "@prisma/client";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = parseUserIdBigInt(session?.user?.id);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: resumeId } = await context.params;
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!resume) {
    return json({ error: "Resume not found" }, { status: 404 });
  }

  let version = null;
  if (resume.activeVersionId) {
    version = await prisma.resumeVersion.findUnique({
      where: { id: resume.activeVersionId },
    });
  }

  if (!version) {
    version = await prisma.resumeVersion.findFirst({
      where: { resumeId: resume.id },
      orderBy: { createdAt: "desc" },
    });
  }

  const data = normalizeResumeData(version?.jsonData as Record<string, unknown>);
  return json({ resume, data });
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = parseUserIdBigInt(session?.user?.id);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: resumeId } = await context.params;
  const body = await request.json().catch(() => ({}));

  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!resume) {
    return json({ error: "Resume not found" }, { status: 404 });
  }

  const title = typeof body?.title === "string" ? body.title : resume.title;
  const template = typeof body?.template === "string" ? body.template : resume.template;
  const isPublic = typeof body?.isPublic === "boolean" ? body.isPublic : resume.isPublic;
  const resumeData = normalizeResumeData(body?.data);
  const source = typeof body?.source === "string" ? body.source : "manual";

  const result = await prisma.$transaction(async (tx) => {
    const updatedResume = await tx.resume.update({
      where: { id: resume.id },
      data: {
        title,
        template,
        isPublic,
      },
    });

    let data = resumeData;
    if (body?.data) {
      const version = await tx.resumeVersion.create({
        data: {
          resumeId: resume.id,
          jsonData: resumeData as unknown as Prisma.InputJsonValue,
          source,
        },
      });

      const updatedWithVersion = await tx.resume.update({
        where: { id: resume.id },
        data: { activeVersionId: version.id },
      });

      return { resume: updatedWithVersion, data };
    }

    return { resume: updatedResume, data: resumeData };
  }, {
    maxWait: 10000,
    timeout: 20000,
  });

  return json(result);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = parseUserIdBigInt(session?.user?.id);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: resumeId } = await context.params;
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!resume) {
    return json({ error: "Resume not found" }, { status: 404 });
  }

  await prisma.resume.delete({ where: { id: resume.id } });
  return json({ success: true });
}
