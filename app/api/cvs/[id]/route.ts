import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeResumeData } from "@/lib/resume-data";
import type { Prisma } from "@prisma/client";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: cvId } = await context.params;
  const cv = await prisma.cV.findFirst({
    where: { id: cvId, userId },
  });

  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  let version = null;
  if (cv.activeVersionId) {
    version = await prisma.cVVersion.findUnique({
      where: { id: cv.activeVersionId },
    });
  }

  if (!version) {
    version = await prisma.cVVersion.findFirst({
      where: { cvId: cv.id },
      orderBy: { createdAt: "desc" },
    });
  }

  const data = normalizeResumeData(version?.jsonData as Record<string, unknown>);
  return NextResponse.json({ cv, data });
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: cvId } = await context.params;
  const body = await request.json().catch(() => ({}));

  const cv = await prisma.cV.findFirst({
    where: { id: cvId, userId },
  });

  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  const title = typeof body?.title === "string" ? body.title : cv.title;
  const template = typeof body?.template === "string" ? body.template : cv.template;
  const isPublic = typeof body?.isPublic === "boolean" ? body.isPublic : cv.isPublic;
  const cvData = normalizeResumeData(body?.data);
  const source = typeof body?.source === "string" ? body.source : "manual";

  const result = await prisma.$transaction(async (tx) => {
    const updatedCV = await tx.cV.update({
      where: { id: cv.id },
      data: {
        title,
        template,
        isPublic,
      },
    });

    let data = cvData;
    if (body?.data) {
      const version = await tx.cVVersion.create({
        data: {
          cvId: cv.id,
          jsonData: cvData as unknown as Prisma.InputJsonValue,
          source,
        },
      });

      const updatedWithVersion = await tx.cV.update({
        where: { id: cv.id },
        data: { activeVersionId: version.id },
      });

      return { cv: updatedWithVersion, data };
    }

    return { cv: updatedCV, data: cvData };
  });

  return NextResponse.json(result);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: cvId } = await context.params;
  const cv = await prisma.cV.findFirst({
    where: { id: cvId, userId },
  });

  if (!cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  await prisma.cV.delete({ where: { id: cv.id } });
  return NextResponse.json({ success: true });
}
