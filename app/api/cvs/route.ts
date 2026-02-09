import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/json";
import { normalizeResumeData } from "@/lib/resume-data";
import { generateShortId } from "@/lib/utils";
import { parseUserIdBigInt } from "@/lib/user-id";
import type { Prisma } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = parseUserIdBigInt(session?.user?.id);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const cvs = await prisma.cv.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return json({ cvs });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = parseUserIdBigInt(session?.user?.id);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
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
        shortId: generateShortId(),
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
  }, {
    maxWait: 10000, // default: 2000
    timeout: 20000, // default: 5000
  });

  return json(result);
}
