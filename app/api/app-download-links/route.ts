import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/json";
import { parseUserIdBigInt } from "@/lib/user-id";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_TTL_DAYS = 7;

function panelPublicBaseUrl() {
  const explicit = process.env.PANEL_PUBLIC_URL;
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/+$/, "");

  const legacy = process.env.NEXT_PUBLIC_API_URL;
  if (legacy && legacy.trim()) return legacy.trim().replace(/\/+$/, "");

  const apiBase = process.env.PANEL_API_BASE_URL;
  if (apiBase && apiBase.trim()) {
    return apiBase.trim().replace(/\/+$/, "").replace(/\/api$/, "");
  }

  return "http://localhost/Panel/public";
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseUserIdBigInt(session.user.id);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        resourceType?: string;
        resourceId?: string;
        templateId?: string;
        data?: unknown;
        title?: string;
      }
    | null;

  const resourceType = body?.resourceType;
  const resourceId = body?.resourceId;

  let resolvedResourceId = resourceId;
  let resourceVersionId: string | null = null;
  let templateId: string | null = null;
  let metaJson: Prisma.InputJsonValue | undefined = undefined;

  if (resourceType === "resume") {
    if (!resourceId || typeof resourceId !== "string") {
      return NextResponse.json({ error: "Invalid resourceId" }, { status: 400 });
    }

    const resume = await prisma.resume.findFirst({
      where: { id: resourceId, userId },
      select: {
        id: true,
        shortId: true,
        activeVersionId: true,
        template: true,
      },
    });
    if (!resume) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    resourceVersionId = resume.activeVersionId ?? null;
    if (!resourceVersionId) {
      const latest = await prisma.resumeVersion.findFirst({
        where: { resumeId: resume.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      resourceVersionId = latest?.id ?? null;
    }
    templateId = resume.template;
  } else if (resourceType === "cv") {
    if (!resourceId || typeof resourceId !== "string") {
      return NextResponse.json({ error: "Invalid resourceId" }, { status: 400 });
    }

    const cv = await prisma.cv.findFirst({
      where: { id: resourceId, userId },
      select: {
        id: true,
        shortId: true,
        activeVersionId: true,
        template: true,
      },
    });
    if (!cv) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    resourceVersionId = cv.activeVersionId ?? null;
    if (!resourceVersionId) {
      const latest = await prisma.cvVersion.findFirst({
        where: { cvId: cv.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      resourceVersionId = latest?.id ?? null;
    }
    templateId = cv.template;
  } else if (resourceType === "cover_letter") {
    const data = body?.data;
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Cover letter data is required" }, { status: 400 });
    }

    const requestedTemplateId =
      typeof body?.templateId === "string" && body.templateId.trim()
        ? body.templateId.trim()
        : "modern";

    resolvedResourceId =
      typeof resourceId === "string" && resourceId.trim()
        ? resourceId.trim()
        : `cover-letter-${Date.now()}`;
    templateId = requestedTemplateId;
    metaJson = {
      data,
      title:
        typeof body?.title === "string" && body.title.trim()
          ? body.title.trim()
          : "Cover Letter",
    } as Prisma.InputJsonValue;
  } else {
    return NextResponse.json({ error: "Unsupported resourceType" }, { status: 400 });
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = sha256Hex(token);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.appDownloadLink.create({
    data: {
      tokenHash,
      userId,
      resourceType: resourceType as string,
      resourceId: resolvedResourceId as string,
      resourceVersionId,
      templateId: templateId ?? undefined,
      format: "pdf",
      expiresAt,
      redeemedCount: 0,
      metaJson,
    },
    select: { id: true },
  });

  const resolverUrl = `${panelPublicBaseUrl()}/l/${token}`;

  return json({
    resolverUrl,
    expiresAt: expiresAt.toISOString(),
  });
}


