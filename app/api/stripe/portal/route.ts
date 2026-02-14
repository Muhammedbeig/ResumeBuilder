import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getStripeGatewayConfig } from "@/lib/panel-payment-gateways";
import { panelInternalGet, panelInternalPatch, PanelInternalApiError } from "@/lib/panel-internal-api";
import { getSessionUserId } from "@/lib/session-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resolveBaseUrl = (request: Request) =>
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;

type UserPaymentProfile = {
  id: string;
  email: string;
  name: string;
  stripeCustomerId: string | null;
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await panelInternalGet<UserPaymentProfile>("user/payment-profile", { userId });
    if (!profile?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stripeCfg = await getStripeGatewayConfig();
    if (!stripeCfg) {
      return NextResponse.json(
        { error: "Stripe is not enabled or not configured in the Admin Panel." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeCfg.secretKey, { typescript: true });

    let customerId = profile.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email ?? undefined,
        name: profile.name ?? undefined,
        metadata: { userId: profile.id },
      });
      customerId = customer.id;
      await panelInternalPatch("user/payment-profile", {
        userId,
        body: { stripeCustomerId: customerId },
      });
    }

    const { searchParams } = new URL(request.url);
    const returnUrlParam = searchParams.get("returnUrl");
    const baseUrl = resolveBaseUrl(request);
    const returnUrl =
      returnUrlParam && returnUrlParam.startsWith("/") ? new URL(returnUrlParam, baseUrl).toString() : baseUrl;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.redirect(portalSession.url);
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
    return NextResponse.json({ error: "Failed to start Stripe portal." }, { status: 500 });
  }
}
