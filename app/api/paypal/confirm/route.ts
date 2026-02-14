import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { panelInternalGet, PanelInternalApiError } from "@/lib/panel-internal-api";
import {
  confirmPayPalPaymentTransaction,
  fetchPayPalOrder,
  parsePayPalCustomId,
  PayPalConfirmationError,
} from "@/lib/paypal-confirmation";
import { getSessionUserId } from "@/lib/session-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InternalTransaction = {
  id: string;
  userId: string;
  gateway: string;
  orderId: string | null;
};

function parseNumericId(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!/^\d+$/.test(value)) return null;
  return value;
}

function parseOrderId(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  return value || null;
}

async function resolveUserIdFromPayPalOrder(orderId: string, paymentTransactionId: string) {
  const { order } = await fetchPayPalOrder(orderId);
  const purchaseUnit = order.purchase_units?.[0];
  const custom = parsePayPalCustomId(purchaseUnit?.custom_id || purchaseUnit?.reference_id);

  if (custom.txId && custom.txId !== paymentTransactionId) {
    throw new PayPalConfirmationError("Order mismatch", 400);
  }
  if (custom.userId) {
    return custom.userId;
  }

  const txRes = await panelInternalGet<{ transaction: InternalTransaction }>(`payment/transactions/${paymentTransactionId}`);
  const tx = txRes.transaction;
  if (!tx) {
    throw new PayPalConfirmationError("Transaction not found", 404);
  }
  if (String(tx.gateway ?? "").toLowerCase() !== "paypal") {
    throw new PayPalConfirmationError("Invalid gateway", 400);
  }
  if (tx.orderId && tx.orderId !== orderId) {
    throw new PayPalConfirmationError("Order mismatch", 400);
  }

  const userId = parseNumericId(tx.userId);
  if (!userId) {
    throw new PayPalConfirmationError("Unable to resolve user from PayPal order", 400);
  }

  return userId;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUserId = getSessionUserId(session);

  const body = await request.json().catch(() => null);
  const paymentTransactionId = parseNumericId((body as any)?.paymentTransactionId);
  const orderId = parseOrderId((body as any)?.orderId);

  if (!paymentTransactionId || !orderId) {
    return NextResponse.json({ error: "Missing paymentTransactionId or orderId" }, { status: 400 });
  }

  try {
    const effectiveUserId = sessionUserId || (await resolveUserIdFromPayPalOrder(orderId, paymentTransactionId));
    const result = await confirmPayPalPaymentTransaction({
      userId: effectiveUserId,
      paymentTransactionId,
      orderId,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PayPalConfirmationError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
    if (error instanceof PanelInternalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
    console.error("PayPal confirm error:", error);
    return NextResponse.json({ error: "Unable to confirm PayPal payment." }, { status: 500 });
  }
}
