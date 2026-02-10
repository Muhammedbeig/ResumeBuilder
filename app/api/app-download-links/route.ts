import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/json";
import { parseUserIdBigInt } from "@/lib/user-id";
import crypto from "crypto";

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
    | { resourceType?: string; resourceId?: string }
    | null;

  const resourceType = body?.resourceType;
  const resourceId = body?.resourceId;

  if (resourceType !== "resume") {
    return NextResponse.json({ error: "Unsupported resourceType" }, { status: 400 });
  }
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

  let resourceVersionId: string | null = resume.activeVersionId ?? null;
  if (!resourceVersionId) {
    const latest = await prisma.resumeVersion.findFirst({
      where: { resumeId: resume.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    resourceVersionId = latest?.id ?? null;
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = sha256Hex(token);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.appDownloadLink.create({
    data: {
      tokenHash,
      userId,
      resourceType: "resume",
      resourceId: resume.id,
      resourceVersionId,
      templateId: resume.template,
      format: "pdf",
      expiresAt,
      redeemedCount: 0,
    },
    select: { id: true },
  });

  const resolverUrl = `${panelPublicBaseUrl()}/l/${token}`;

  return json({
    resolverUrl,
    expiresAt: expiresAt.toISOString(),
  });
}


