import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/json";
import { parseUserIdBigInt } from "@/lib/user-id";
import { resolvePanelAssetUrl } from "@/lib/panel-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseUserIdBigInt(session.user.id);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.paymentTransaction.findMany({
    where: {
      userId,
      paymentGateway: "BankTransfer",
      package: { type: "item_listing" },
    },
    orderBy: { id: "desc" },
    include: {
      package: {
        select: {
          id: true,
          name: true,
          finalPrice: true,
          duration: true,
        },
      },
    },
  });

  const receipts = transactions.map((t) => ({
    id: t.id.toString(),
    packageId: t.packageId?.toString?.() ?? null,
    packageName: t.package?.name ?? null,
    amount: t.amount,
    status: t.paymentStatus,
    orderId: t.orderId ?? null,
    receiptPath: t.paymentReceipt ?? null,
    receiptUrl: t.paymentReceipt ? resolvePanelAssetUrl(t.paymentReceipt) : null,
    createdAt: t.createdAt,
  }));

  return json({ receipts });
}

