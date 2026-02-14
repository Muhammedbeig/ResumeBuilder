import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { panelInternalGet, PanelInternalApiError } from "@/lib/panel-internal-api";
import { confirmPayPalPaymentTransaction, PayPalConfirmationError } from "@/lib/paypal-confirmation";
import { getSessionUserId } from "@/lib/session-user";
import { confirmStripePaymentTransaction, StripeConfirmationError } from "@/lib/stripe-confirmation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActivationStatusResponse = {
  status: "pending" | "active" | "failed";
  subscription: "free" | "pro" | "business";
  subscriptionPlanId: "weekly" | "monthly" | "annual" | null;
};

type InternalTransaction = {
  id: string;
  gateway: string;
  status: string;
  orderId: string | null;
};

async function tryAutoConfirmPendingTransaction(userId: string, paymentTransactionId: string) {
  const txRes = await panelInternalGet<{ transaction: InternalTransaction }>(`payment/transactions/${paymentTransactionId}`, {
    userId,
  });
  const tx = txRes.transaction;
  if (!tx) {
    return;
  }

  const gateway = String(tx.gateway ?? "").toLowerCase();
  if (gateway === "stripe") {
    await confirmStripePaymentTransaction({
      userId,
      paymentTransactionId,
    });
    return;
  }

  if (gateway === "paypal") {
    await confirmPayPalPaymentTransaction({
      userId,
      paymentTransactionId,
      orderId: tx.orderId ?? undefined,
    });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const paymentTransactionId = url.searchParams.get("paymentTransactionId");
  const path = paymentTransactionId
    ? `payment/activation-status?paymentTransactionId=${encodeURIComponent(paymentTransactionId)}`
    : "payment/activation-status";

  try {
    const data = await panelInternalGet<ActivationStatusResponse>(path, { userId });

    if (data.status === "pending" && paymentTransactionId && /^\d+$/.test(paymentTransactionId)) {
      try {
        await tryAutoConfirmPendingTransaction(userId, paymentTransactionId);
      } catch (error) {
        const isRecoverableGatewayError =
          (error instanceof StripeConfirmationError || error instanceof PayPalConfirmationError) &&
          (error.status ?? 500) < 500;
        if (!isRecoverableGatewayError) {
          console.error("Activation auto-confirm error:", error);
        }
      }

      const refreshed = await panelInternalGet<ActivationStatusResponse>(path, { userId });
      return NextResponse.json(refreshed);
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to read activation status" }, { status: 500 });
  }
}
