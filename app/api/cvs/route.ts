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

  const cvs = await prisma.cv.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ cvs });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title : "Untitled CV";
  const template = typeof body?.template === "string" ? body.template : "academic-cv";
  // We reuse normalizeResumeData as the data structure is the same
  const cvData = normalizeResumeData(body?.data);
  const source = typeof body?.source === "string" ? body.source : "manual";

  const result = await prisma.$transaction(async (tx) => {
    const cv = await tx.cv.create({
      data: {
        userId,
        title,
        template,
      },
    });

    const version = await tx.cvVersion.create({
      data: {
        cvId: cv.id,
        jsonData: cvData as unknown as Prisma.InputJsonValue,
        source,
      },
    });

    const updated = await tx.cv.update({
      where: { id: cv.id },
      data: { activeVersionId: version.id },
    });

    return { cv: updated, data: cvData };
  });

  return NextResponse.json(result);
}
