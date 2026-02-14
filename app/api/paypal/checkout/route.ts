import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getPayPalGatewayConfig } from "@/lib/panel-payment-gateways";
import { panelInternalGet, panelInternalPatch, panelInternalPost, PanelInternalApiError } from "@/lib/panel-internal-api";
import { getSessionUserId } from "@/lib/session-user";
import { paypalRequest } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resolveHeaderValue = (value: string | null) => {
  if (!value) return "";
  return value.split(",")[0]?.trim() ?? "";
};

const resolveRequestOrigin = (request: Request) => {
  try {
    const reqUrl = new URL(request.url);
    const forwardedHost = resolveHeaderValue(request.headers.get("x-forwarded-host"));
    const host = forwardedHost || resolveHeaderValue(request.headers.get("host")) || reqUrl.host;
    if (!host) return null;

    const forwardedProto = resolveHeaderValue(request.headers.get("x-forwarded-proto")).toLowerCase();
    const isLocalHost =
      host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
    const protocol =
      forwardedProto === "http" || forwardedProto === "https"
        ? forwardedProto
        : isLocalHost
        ? "http"
        : "https";

    return `${protocol}://${host}`;
  } catch {
    return null;
  }
};

const resolveBaseUrl = (request: Request) =>
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  resolveRequestOrigin(request) ||
  new URL(request.url).origin;

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

function parsePackageId(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!/^\d+$/.test(value)) return null;
  return value;
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

type InternalPackage = {
  id: string;
  name: string;
  description: string;
  finalPrice: number;
  type: string;
  status: number;
};

type UserPaymentProfile = {
  id: string;
  email: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { packageId?: string; returnUrl?: string };
  const packageId = parsePackageId(body.packageId);
  if (!packageId) {
    return NextResponse.json({ error: "Missing or invalid packageId" }, { status: 400 });
  }

  let paymentTransactionId: string | null = null;

  try {
    const packageRes = await panelInternalGet<{ package: InternalPackage }>(`packages/${packageId}`);
    const pkg = packageRes.package;
    if (!pkg || pkg.status !== 1 || pkg.type !== "item_listing") {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    if (!(pkg.finalPrice > 0)) {
      return NextResponse.json({ error: "This package does not require payment" }, { status: 400 });
    }

    const paypalCfg = await getPayPalGatewayConfig();
    if (!paypalCfg) {
      return NextResponse.json(
        { error: "PayPal is not enabled or not configured in the Admin Panel." },
        { status: 503 }
      );
    }

    const profile = await panelInternalGet<UserPaymentProfile>("user/payment-profile", { userId });
    if (!profile?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const txRes = await panelInternalPost<{ transaction: { id: string } }>("payment/transactions", {
      userId,
      body: {
        packageId: pkg.id,
        amount: pkg.finalPrice,
        gateway: "Paypal",
        status: "pending",
      },
    });
    paymentTransactionId = txRes.transaction.id;

    const baseUrl = resolveBaseUrl(request);
    const resolvedReturnUrl = resolveReturnUrl(body.returnUrl, baseUrl);

    const successUrl = new URL(resolvedReturnUrl);
    successUrl.searchParams.set("paypal", "success");
    successUrl.searchParams.set("payment_transaction_id", paymentTransactionId);

    const cancelUrl = new URL(resolvedReturnUrl);
    cancelUrl.searchParams.set("paypal", "cancel");
    cancelUrl.searchParams.set("payment_transaction_id", paymentTransactionId);

    const order = await paypalRequest<PayPalOrder>(paypalCfg, "/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: `${paymentTransactionId}:${profile.id}`,
            amount: {
              currency_code: paypalCfg.currencyCode,
              value: pkg.finalPrice.toFixed(2),
            },
            description: pkg.name,
          },
        ],
        payer: {
          email_address: profile.email || undefined,
        },
        application_context: {
          return_url: successUrl.toString(),
          cancel_url: cancelUrl.toString(),
          user_action: "PAY_NOW",
        },
      }),
    });

    if (!order?.id) {
      throw new Error("PayPal order creation failed");
    }

    await panelInternalPatch(`payment/transactions/${paymentTransactionId}`, {
      userId,
      body: { orderId: order.id },
    });

    const approval = order.links?.find((link) => link.rel === "approve")?.href;
    if (!approval) {
      throw new Error("Missing PayPal approval URL");
    }

    return NextResponse.json({ url: approval });
  } catch (error) {
    if (paymentTransactionId) {
      try {
        await panelInternalPatch(`payment/transactions/${paymentTransactionId}`, {
          userId,
          body: { status: "failed" },
        });
      } catch {
        // ignore cleanup errors
      }
    }

    if (error instanceof PanelInternalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
    console.error("PayPal checkout error:", error);
    return NextResponse.json({ error: "Unable to start PayPal checkout. Please try again." }, { status: 500 });
  }
}
