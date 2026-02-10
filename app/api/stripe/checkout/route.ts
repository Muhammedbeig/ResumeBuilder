import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeGatewayConfig } from "@/lib/panel-payment-gateways";
import { parseUserIdBigInt } from "@/lib/user-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resolveBaseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

const resolveReturnUrl = (returnUrl: string | undefined, baseUrl: string) => {
  if (!returnUrl) return baseUrl;
  try {
    const base = new URL(baseUrl);
    if (returnUrl.startsWith("/")) {
      return new URL(returnUrl, base).toString();
    }
    const candidate = new URL(returnUrl);
    if (candidate.origin === base.origin) {
      return candidate.toString();
    }
  } catch {
    // ignore invalid URL
  }
  return baseUrl;
};

function parsePackageId(raw: unknown): bigint | null {
  const value = String(raw ?? "").trim();
  if (!/^\d+$/.test(value)) return null;
  try {
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

  const body = (await request.json()) as {
    packageId?: string;
    returnUrl?: string;
  };

  const packageId = parsePackageId(body.packageId);
  if (!packageId) {
    return NextResponse.json(
      { error: "Missing or invalid packageId" },
      { status: 400 }
    );
  }

  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    select: {
      id: true,
      name: true,
      description: true,
      finalPrice: true,
      type: true,
      status: true,
    },
  });

  if (!pkg || pkg.status !== 1 || pkg.type !== "item_listing") {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  if (!(pkg.finalPrice > 0)) {
    return NextResponse.json(
      { error: "This package does not require payment" },
      { status: 400 }
    );
  }

  const stripeCfg = await getStripeGatewayConfig();
  if (!stripeCfg) {
    return NextResponse.json(
      { error: "Stripe is not enabled or not configured in the Admin Panel." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeCfg.secretKey, { typescript: true });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Create a local transaction record first so Stripe metadata can reference it.
  const now = new Date();
  const paymentTransaction = await prisma.paymentTransaction.create({
    data: {
      userId: user.id,
      packageId: pkg.id,
      amount: pkg.finalPrice,
      paymentGateway: "Stripe",
      paymentStatus: "pending",
      createdAt: now,
      updatedAt: now,
    },
    select: { id: true },
  });

  try {
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { userId: user.id.toString() },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const baseUrl = resolveBaseUrl();
    const resolvedReturnUrl = resolveReturnUrl(body.returnUrl, baseUrl);

    const successUrl = new URL(resolvedReturnUrl);
    successUrl.searchParams.set("stripe", "success");
    successUrl.searchParams.set(
      "payment_transaction_id",
      paymentTransaction.id.toString()
    );

    // Stripe replaces this exact token. Keep braces unencoded so the value is substituted.
    const successUrlString = `${successUrl.toString()}&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = new URL(resolvedReturnUrl);
    cancelUrl.searchParams.set("stripe", "cancel");
    cancelUrl.searchParams.set(
      "payment_transaction_id",
      paymentTransaction.id.toString()
    );

    const unitAmount = Math.round(pkg.finalPrice * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      throw new Error("Invalid package price");
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      client_reference_id: user.id.toString(),
      success_url: successUrlString,
      cancel_url: cancelUrl.toString(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: stripeCfg.currencyCode,
            unit_amount: unitAmount,
            product_data: {
              name: pkg.name,
              description: pkg.description || undefined,
            },
          },
        },
      ],
      // This metadata is what the Panel webhook expects on payment_intent.succeeded.
      payment_intent_data: {
        metadata: {
          payment_transaction_id: paymentTransaction.id.toString(),
          package_id: pkg.id.toString(),
          user_id: user.id.toString(),
          email: user.email ?? "",
          platform_type: "web",
        },
      },
      // Optional, but helpful for debugging in Stripe dashboard.
      metadata: {
        payment_transaction_id: paymentTransaction.id.toString(),
        package_id: pkg.id.toString(),
        user_id: user.id.toString(),
      },
      expand: ["payment_intent"],
    });

    const paymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id;

    if (paymentIntentId) {
      await prisma.paymentTransaction.update({
        where: { id: paymentTransaction.id },
        data: { orderId: paymentIntentId, updatedAt: new Date() },
      });
    }

    if (!checkoutSession.url) {
      throw new Error("Missing checkout URL");
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    // Keep the record for audit, but mark it failed.
    await prisma.paymentTransaction.update({
      where: { id: paymentTransaction.id },
      data: { paymentStatus: "failed", updatedAt: new Date() },
    });

    return NextResponse.json(
      { error: "Unable to start Stripe checkout. Please try again." },
      { status: 500 }
    );
  }
}
