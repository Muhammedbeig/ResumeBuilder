import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";

import { authOptions } from "@/lib/auth";
import { getStripeGatewayConfig } from "@/lib/panel-payment-gateways";
import { PanelInternalApiError } from "@/lib/panel-internal-api";
import { getSessionUserId } from "@/lib/session-user";
import { confirmStripePaymentTransaction, StripeConfirmationError } from "@/lib/stripe-confirmation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseNumericId(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!/^\d+$/.test(value)) return null;
  return value;
}

function parseSessionId(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  return value;
}

async function resolveTransactionIdFromCheckoutSession(checkoutSessionId: string) {
  const stripeCfg = await getStripeGatewayConfig();
  if (!stripeCfg) {
    throw new StripeConfirmationError("Stripe is not enabled or not configured in the Admin Panel.", 503);
  }

  const stripe = new Stripe(stripeCfg.secretKey, { typescript: true });
  const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);
  const md = checkoutSession.metadata ?? {};
  const mdTxId = parseNumericId(md.payment_transaction_id);
  if (!mdTxId) {
    throw new StripeConfirmationError("Checkout session missing transaction metadata", 400);
  }

  return mdTxId;
}

async function resolveUserIdFromCheckoutSession(checkoutSessionId: string, paymentTransactionId: string) {
  const stripeCfg = await getStripeGatewayConfig();
  if (!stripeCfg) {
    throw new StripeConfirmationError("Stripe is not enabled or not configured in the Admin Panel.", 503);
  }

  const stripe = new Stripe(stripeCfg.secretKey, { typescript: true });
  const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
    expand: ["payment_intent"],
  });

  const md = checkoutSession.metadata ?? {};
  const mdTxId = parseNumericId(md.payment_transaction_id);
  if (mdTxId && mdTxId !== paymentTransactionId) {
    throw new StripeConfirmationError("Checkout session mismatch", 400);
  }

  const mdUserId = parseNumericId(md.user_id);
  const refUserId = parseNumericId(checkoutSession.client_reference_id);
  const resolvedUserId = mdUserId || refUserId;
  if (!resolvedUserId) {
    throw new StripeConfirmationError("Unable to resolve user from checkout session", 400);
  }

  return resolvedUserId;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUserId = getSessionUserId(session);

  const body = await request.json().catch(() => null);
  let paymentTransactionId = parseNumericId((body as any)?.paymentTransactionId);
  const checkoutSessionId = parseSessionId((body as any)?.sessionId);

  if (!paymentTransactionId && checkoutSessionId) {
    paymentTransactionId = await resolveTransactionIdFromCheckoutSession(checkoutSessionId);
  }

  if (!paymentTransactionId) {
    return NextResponse.json({ error: "Missing paymentTransactionId" }, { status: 400 });
  }

  try {
    let effectiveUserId = sessionUserId;
    if (!effectiveUserId) {
      if (!checkoutSessionId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      effectiveUserId = await resolveUserIdFromCheckoutSession(checkoutSessionId, paymentTransactionId);
    }

    const result = await confirmStripePaymentTransaction({
      userId: effectiveUserId,
      paymentTransactionId,
      checkoutSessionId,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StripeConfirmationError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
    if (error instanceof PanelInternalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
    console.error("Stripe confirm error:", error);
    return NextResponse.json({ error: "Unable to confirm Stripe payment." }, { status: 500 });
  }
}
