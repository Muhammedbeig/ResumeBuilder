import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPayPalGatewayConfig } from "@/lib/panel-payment-gateways";
import { parseUserIdBigInt } from "@/lib/user-id";
import { paypalRequest } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseBigIntId(raw: unknown): bigint | null {
  const value = String(raw ?? "").trim();
  if (!/^\d+$/.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

type PayPalAmount = {
  currency_code?: string;
  value?: string;
};

type PayPalCapture = {
  id?: string;
  status?: string;
  amount?: PayPalAmount;
};

type PayPalPurchaseUnit = {
  custom_id?: string;
  reference_id?: string;
  amount?: PayPalAmount;
  payments?: {
    captures?: PayPalCapture[];
  };
};

type PayPalOrder = {
  id: string;
  status: string;
  purchase_units?: PayPalPurchaseUnit[];
};

function normalizeAmount(value?: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function amountsMatch(expected: number, actual: number | null) {
  if (actual === null) return false;
  return Math.abs(expected - actual) < 0.01;
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

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const paymentTransactionId = parseBigIntId(body?.paymentTransactionId);
  const orderId = String(body?.orderId ?? "").trim();

  if (!paymentTransactionId || !orderId) {
    return NextResponse.json(
      { error: "Missing paymentTransactionId or orderId" },
      { status: 400 }
    );
  }

  const tx = await prisma.paymentTransaction.findUnique({
    where: { id: paymentTransactionId },
    select: {
      id: true,
      userId: true,
      packageId: true,
      paymentGateway: true,
      paymentStatus: true,
      orderId: true,
    },
  });

  if (!tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (tx.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (String(tx.paymentGateway ?? "").toLowerCase() !== "paypal") {
    return NextResponse.json({ error: "Invalid gateway" }, { status: 400 });
  }

  if (tx.paymentStatus === "succeed") {
    return NextResponse.json({ ok: true, alreadyConfirmed: true });
  }

  if (tx.orderId && tx.orderId !== orderId) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  if (!tx.packageId) {
    return NextResponse.json(
      { error: "Transaction missing packageId" },
      { status: 400 }
    );
  }

  const packageId = tx.packageId;

  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    select: {
      id: true,
      duration: true,
      itemLimit: true,
      listingDurationType: true,
      listingDurationDays: true,
      type: true,
      status: true,
      finalPrice: true,
    },
  });

  if (!pkg || pkg.status !== 1 || pkg.type !== "item_listing") {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const paypalCfg = await getPayPalGatewayConfig();
  if (!paypalCfg) {
    return NextResponse.json(
      { error: "PayPal is not enabled or not configured in the Admin Panel." },
      { status: 503 }
    );
  }

  const order = await paypalRequest<PayPalOrder>(
    paypalCfg,
    `/v2/checkout/orders/${orderId}`,
    { method: "GET" }
  );

  const unit = order.purchase_units?.[0];
  const customId = unit?.custom_id || unit?.reference_id;
  if (customId && customId !== tx.id.toString()) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  let finalOrder = order;
  if (order.status === "APPROVED") {
    finalOrder = await paypalRequest<PayPalOrder>(
      paypalCfg,
      `/v2/checkout/orders/${orderId}/capture`,
      { method: "POST" }
    );
  }

  if (finalOrder.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Payment not completed" },
      { status: 409 }
    );
  }

  const expectedAmount = Number(pkg.finalPrice ?? 0);
  const captureAmount =
    finalOrder.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ??
    finalOrder.purchase_units?.[0]?.amount?.value ??
    order.purchase_units?.[0]?.amount?.value;
  const actualAmount = normalizeAmount(captureAmount);
  if (!amountsMatch(expectedAmount, actualAmount)) {
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const currency =
    finalOrder.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code ??
    finalOrder.purchase_units?.[0]?.amount?.currency_code ??
    order.purchase_units?.[0]?.amount?.currency_code;
  if (currency && currency.toUpperCase() !== paypalCfg.currencyCode) {
    return NextResponse.json({ error: "Currency mismatch" }, { status: 400 });
  }

  const now = new Date();
  const durationRaw = String(pkg.duration ?? "").trim().toLowerCase();
  const durationDays =
    durationRaw && durationRaw !== "unlimited" ? Number.parseInt(durationRaw, 10) : null;

  const endDate =
    durationDays && Number.isFinite(durationDays) && durationDays > 0
      ? addDays(now, durationDays)
      : null;

  const itemLimitRaw = String(pkg.itemLimit ?? "").trim().toLowerCase();
  const totalLimit =
    itemLimitRaw && itemLimitRaw !== "unlimited" ? Number.parseInt(itemLimitRaw, 10) : null;

  await prisma.$transaction(async (db) => {
    const latestTx = await db.paymentTransaction.findUnique({
      where: { id: tx.id },
      select: { paymentStatus: true },
    });

    if (latestTx?.paymentStatus !== "succeed") {
      await db.paymentTransaction.update({
        where: { id: tx.id },
        data: {
          paymentStatus: "succeed",
          orderId: tx.orderId ?? orderId,
        },
      });
    }

    const existingPurchase = await db.userPurchasedPackage.findFirst({
      where: { paymentTransactionId: tx.id },
      select: { id: true },
    });

    if (!existingPurchase) {
      await db.userPurchasedPackage.create({
        data: {
          userId,
          packageId: pkg.id,
          startDate: now,
          endDate,
          totalLimit:
            totalLimit && Number.isFinite(totalLimit) && totalLimit >= 0 ? totalLimit : null,
          usedLimit: 0,
          paymentTransactionId: tx.id,
          listingDurationType: pkg.listingDurationType ?? null,
          listingDurationDays: pkg.listingDurationDays ?? null,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
