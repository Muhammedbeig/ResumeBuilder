import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPayPalGatewayConfig } from "@/lib/panel-payment-gateways";
import { parseUserIdBigInt } from "@/lib/user-id";
import { paypalRequest } from "@/lib/paypal";

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

type PayPalOrderLink = {
  href: string;
  rel: string;
  method?: string;
};

type PayPalOrder = {
  id: string;
  status: string;
  links?: PayPalOrderLink[];
};

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

  const paypalCfg = await getPayPalGatewayConfig();
  if (!paypalCfg) {
    return NextResponse.json(
      { error: "PayPal is not enabled or not configured in the Admin Panel." },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const paymentTransaction = await prisma.paymentTransaction.create({
    data: {
      userId: user.id,
      packageId: pkg.id,
      amount: pkg.finalPrice,
      paymentGateway: "Paypal",
      paymentStatus: "pending",
    },
    select: { id: true },
  });

  try {
    const baseUrl = resolveBaseUrl();
    const resolvedReturnUrl = resolveReturnUrl(body.returnUrl, baseUrl);

    const successUrl = new URL(resolvedReturnUrl);
    successUrl.searchParams.set("paypal", "success");
    successUrl.searchParams.set(
      "payment_transaction_id",
      paymentTransaction.id.toString()
    );

    const cancelUrl = new URL(resolvedReturnUrl);
    cancelUrl.searchParams.set("paypal", "cancel");
    cancelUrl.searchParams.set(
      "payment_transaction_id",
      paymentTransaction.id.toString()
    );

    const order = await paypalRequest<PayPalOrder>(paypalCfg, "/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: paymentTransaction.id.toString(),
            custom_id: paymentTransaction.id.toString(),
            description: pkg.description || undefined,
            amount: {
              currency_code: paypalCfg.currencyCode,
              value: Number(pkg.finalPrice ?? 0).toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: successUrl.toString(),
          cancel_url: cancelUrl.toString(),
          brand_name: "ResuPro",
          user_action: "PAY_NOW",
        },
      }),
    });

    if (order?.id) {
      await prisma.paymentTransaction.update({
        where: { id: paymentTransaction.id },
        data: { orderId: order.id },
      });
    }

    const approveLink = order?.links?.find((link) =>
      link.rel === "approve" || link.rel === "payer-action"
    )?.href;

    if (!approveLink) {
      throw new Error("Missing approval link");
    }

    return NextResponse.json({ url: approveLink, orderId: order.id });
  } catch (error) {
    console.error("PayPal checkout error:", error);

    await prisma.paymentTransaction.update({
      where: { id: paymentTransaction.id },
      data: { paymentStatus: "failed" },
    });

    return NextResponse.json(
      { error: "Unable to start PayPal checkout. Please try again." },
      { status: 500 }
    );
  }
}
