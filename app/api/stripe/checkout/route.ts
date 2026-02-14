import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getStripeGatewayConfig } from "@/lib/panel-payment-gateways";
import { panelInternalGet, panelInternalPatch, panelInternalPost, PanelInternalApiError } from "@/lib/panel-internal-api";
import { getSessionUserId } from "@/lib/session-user";

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
  name: string;
  stripeCustomerId: string | null;
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

    const stripeCfg = await getStripeGatewayConfig();
    if (!stripeCfg) {
      return NextResponse.json(
        { error: "Stripe is not enabled or not configured in the Admin Panel." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeCfg.secretKey, { typescript: true });

    const profile = await panelInternalGet<UserPaymentProfile>("user/payment-profile", { userId });
    if (!profile?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const txRes = await panelInternalPost<{ transaction: { id: string } }>("payment/transactions", {
      userId,
      body: {
        packageId: pkg.id,
        amount: pkg.finalPrice,
        gateway: "Stripe",
        status: "pending",
      },
    });
    paymentTransactionId = txRes.transaction.id;

    let customerId = profile.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || undefined,
        name: profile.name || undefined,
        metadata: { userId: profile.id },
      });
      customerId = customer.id;
      await panelInternalPatch("user/payment-profile", {
        userId,
        body: { stripeCustomerId: customerId },
      });
    }

    const baseUrl = resolveBaseUrl(request);
    const resolvedReturnUrl = resolveReturnUrl(body.returnUrl, baseUrl);

    const callbackBase = new URL("/api/stripe/return", baseUrl);
    callbackBase.searchParams.set("return_url", resolvedReturnUrl);
    callbackBase.searchParams.set("payment_transaction_id", paymentTransactionId);

    const successUrl = new URL(callbackBase);
    successUrl.searchParams.set("stripe", "success");
    const successUrlString = `${successUrl.toString()}&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = new URL(callbackBase);
    cancelUrl.searchParams.set("stripe", "cancel");

    const unitAmount = Math.round(pkg.finalPrice * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      throw new Error("Invalid package price");
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      client_reference_id: profile.id,
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
      payment_intent_data: {
        metadata: {
          payment_transaction_id: paymentTransactionId,
          package_id: pkg.id,
          user_id: profile.id,
          email: profile.email || "",
          platform_type: "web",
        },
      },
      metadata: {
        payment_transaction_id: paymentTransactionId,
        package_id: pkg.id,
        user_id: profile.id,
      },
      expand: ["payment_intent"],
    });

    const paymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id;
    await panelInternalPatch(`payment/transactions/${paymentTransactionId}`, {
      userId,
      body: { orderId: paymentIntentId ?? checkoutSession.id },
    });

    if (!checkoutSession.url) {
      throw new Error("Missing checkout URL");
    }

    return NextResponse.json({ url: checkoutSession.url });
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
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Unable to start Stripe checkout. Please try again." }, { status: 500 });
  }
}
