import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaidPlanById, type PaidPlanId } from "@/lib/pricing-plans";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "bank-receipts");

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const planId = formData.get("planId");
  const file = formData.get("file");

  if (typeof planId !== "string") {
    return NextResponse.json({ error: "Missing planId" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const plan = getPaidPlanById(planId as PaidPlanId);
  if (!plan) {
    return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, filename);
  await writeFile(filePath, buffer);

  const record = await prisma.bankTransferReceipt.create({
    data: {
      userId: session.user.id,
      planId: plan.planId,
      amountCents: plan.amountCents,
      currency: "usd",
      filePath: `/uploads/bank-receipts/${filename}`,
      fileName: file.name,
      status: "pending",
    },
  });

  return NextResponse.json({ receipt: record });
}
