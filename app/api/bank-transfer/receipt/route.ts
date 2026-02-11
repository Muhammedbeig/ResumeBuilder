import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/json";
import { parseUserIdBigInt } from "@/lib/user-id";
import { getBankTransferSettings } from "@/lib/bank-transfer-settings";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PANEL_STORAGE_PUBLIC_DIR = "C:\\xampp\\htdocs\\Panel\\storage\\app\\public";
const MAX_BYTES = 7 * 1024 * 1024; // ~7MB

function panelStoragePublicDir() {
  const explicit = process.env.PANEL_STORAGE_PUBLIC_DIR;
  if (explicit && explicit.trim()) return explicit.trim();
  return DEFAULT_PANEL_STORAGE_PUBLIC_DIR;
}

function parseBigIntId(value: string): bigint | null {
  try {
    if (!value) return null;
    return BigInt(value);
  } catch {
    return null;
  }
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

  const bankSettings = await getBankTransferSettings();
  if (!bankSettings.enabled) {
    return NextResponse.json(
      { error: "Bank transfer is currently disabled." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const packageIdRaw = formData.get("packageId");
  const file = formData.get("file");

  if (typeof packageIdRaw !== "string") {
    return NextResponse.json({ error: "Missing packageId" }, { status: 400 });
  }

  const packageId = parseBigIntId(packageIdRaw);
  if (!packageId) {
    return NextResponse.json({ error: "Invalid packageId" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const allowedTypes = ["image/png", "image/jpeg"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const pkg = await prisma.package.findFirst({
    where: { id: packageId, status: 1, type: "item_listing" },
    select: { id: true, finalPrice: true },
  });
  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }
  if (!(pkg.finalPrice > 0)) {
    return NextResponse.json(
      { error: "This package is free and does not require a receipt." },
      { status: 400 }
    );
  }

  const existing = await prisma.paymentTransaction.findFirst({
    where: {
      userId,
      packageId,
      paymentGateway: "BankTransfer",
      paymentStatus: { in: ["pending", "under_review"] },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A bank transfer for this package is already pending review." },
      { status: 409 }
    );
  }

  // Write to the Panel's public disk so admins can view receipts from the Panel UI.
  const ext = file.type === "image/png" ? ".png" : ".jpg";
  const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
  const relativeReceiptPath = `bank-transfer/${filename}`;

  const targetDir = path.join(panelStoragePublicDir(), "bank-transfer");
  await mkdir(targetDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(targetDir, filename), buffer);

  // Must be EXACTLY: `<prefix>-p-<packageId>` (no extra `-` in prefix),
  // because the Panel parses `order_id` using `explode('-', ...)`.
  const orderPrefix = crypto.randomBytes(12).toString("hex");
  const orderId = `${orderPrefix}-p-${pkg.id.toString()}`;

  const now = new Date();
  const transaction = await prisma.paymentTransaction.create({
    data: {
      userId,
      packageId: pkg.id,
      amount: pkg.finalPrice,
      paymentGateway: "BankTransfer",
      orderId,
      paymentStatus: "under_review",
      paymentReceipt: relativeReceiptPath,
      createdAt: now,
      updatedAt: now,
    },
  });

  return json({
    transaction: {
      id: transaction.id.toString(),
      orderId: transaction.orderId,
      paymentStatus: transaction.paymentStatus,
      paymentReceipt: transaction.paymentReceipt,
      amount: transaction.amount,
      packageId: transaction.packageId?.toString?.() ?? null,
      createdAt: transaction.createdAt,
    },
  });
}
