import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeGatewayConfig } from "@/lib/panel-payment-gateways";
import { parseUserIdBigInt } from "@/lib/user-id";

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
  const checkoutSessionId = String(body?.sessionId ?? "").trim();

  if (!paymentTransactionId || !checkoutSessionId) {
    return NextResponse.json(
      { error: "Missing paymentTransactionId or sessionId" },
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

  if (String(tx.paymentGateway ?? "").toLowerCase() !== "stripe") {
    return NextResponse.json({ error: "Invalid gateway" }, { status: 400 });
  }

  if (tx.paymentStatus === "succeed") {
    return NextResponse.json({ ok: true, alreadyConfirmed: true });
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
    },
  });

  if (!pkg || pkg.status !== 1 || pkg.type !== "item_listing") {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const stripeCfg = await getStripeGatewayConfig();
  if (!stripeCfg) {
    return NextResponse.json(
      { error: "Stripe is not enabled or not configured in the Admin Panel." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeCfg.secretKey, { typescript: true });

  // Validate the checkout session really belongs to this user/transaction.
  const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
    expand: ["payment_intent"],
  });

  const md = checkoutSession.metadata ?? {};
  const mdTx = md.payment_transaction_id;
  const mdUser = md.user_id;
  const mdPkg = md.package_id;

  if (
    (typeof checkoutSession.client_reference_id === "string" &&
      checkoutSession.client_reference_id !== userId.toString()) ||
    (mdTx && mdTx !== tx.id.toString()) ||
    (mdUser && mdUser !== userId.toString()) ||
    (mdPkg && mdPkg !== packageId.toString())
  ) {
    return NextResponse.json({ error: "Checkout session mismatch" }, { status: 400 });
  }

  const paid = checkoutSession.payment_status === "paid";
  if (!paid) {
    return NextResponse.json(
      { error: "Payment not completed" },
      { status: 409 }
    );
  }

  const paymentIntentId =
    typeof checkoutSession.payment_intent === "string"
      ? checkoutSession.payment_intent
      : checkoutSession.payment_intent?.id;

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
          orderId: paymentIntentId ?? tx.orderId ?? undefined,
          updatedAt: now,
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
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}

