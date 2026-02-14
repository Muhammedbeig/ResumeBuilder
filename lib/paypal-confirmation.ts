import "server-only";

import { getPayPalGatewayConfig } from "@/lib/panel-payment-gateways";
import { panelInternalGet, panelInternalPost } from "@/lib/panel-internal-api";
import { paypalRequest } from "@/lib/paypal";

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

export type PayPalOrder = {
  id: string;
  status: string;
  purchase_units?: PayPalPurchaseUnit[];
};

type InternalTransaction = {
  id: string;
  userId: string;
  packageId: string | null;
  gateway: string;
  status: string;
  orderId: string | null;
};

type InternalPackage = {
  id: string;
  finalPrice: number;
  type: string;
  status: number;
};

export class PayPalConfirmationError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "PayPalConfirmationError";
    this.status = status;
  }
}

function normalizeAmount(value?: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function amountsMatch(expected: number, actual: number | null) {
  if (actual === null) return false;
  return Math.abs(expected - actual) < 0.01;
}

export function parsePayPalCustomId(raw: string | undefined | null) {
  const value = String(raw ?? "").trim();
  if (!value) return { txId: null as string | null, userId: null as string | null };

  if (value.includes(":")) {
    const [txIdRaw, userIdRaw] = value.split(":", 2);
    const txId = /^\d+$/.test(txIdRaw) ? txIdRaw : null;
    const userId = /^\d+$/.test(userIdRaw) ? userIdRaw : null;
    return { txId, userId };
  }

  return {
    txId: /^\d+$/.test(value) ? value : null,
    userId: null,
  };
}

export async function fetchPayPalOrder(orderId: string) {
  const paypalCfg = await getPayPalGatewayConfig();
  if (!paypalCfg) {
    throw new PayPalConfirmationError("PayPal is not enabled or not configured in the Admin Panel.", 503);
  }

  const order = await paypalRequest<PayPalOrder>(paypalCfg, `/v2/checkout/orders/${orderId}`, {
    method: "GET",
  });

  return { order, paypalCfg };
}

type ConfirmPayPalPaymentInput = {
  userId: string;
  paymentTransactionId: string;
  orderId?: string | null;
};

export async function confirmPayPalPaymentTransaction({
  userId,
  paymentTransactionId,
  orderId,
}: ConfirmPayPalPaymentInput) {
  const txRes = await panelInternalGet<{ transaction: InternalTransaction }>(`payment/transactions/${paymentTransactionId}`, {
    userId,
  });
  const tx = txRes.transaction;
  if (!tx) {
    throw new PayPalConfirmationError("Transaction not found", 404);
  }

  if (String(tx.gateway ?? "").toLowerCase() !== "paypal") {
    throw new PayPalConfirmationError("Invalid gateway", 400);
  }
  if (tx.status === "succeed") {
    return { ok: true as const, alreadyConfirmed: true as const };
  }

  const effectiveOrderId = String(orderId ?? tx.orderId ?? "").trim();
  if (!effectiveOrderId) {
    throw new PayPalConfirmationError("Missing orderId", 400);
  }
  if (tx.orderId && tx.orderId !== effectiveOrderId) {
    throw new PayPalConfirmationError("Order mismatch", 400);
  }

  if (!tx.packageId) {
    throw new PayPalConfirmationError("Transaction missing packageId", 400);
  }

  const packageRes = await panelInternalGet<{ package: InternalPackage }>(`packages/${tx.packageId}`);
  const pkg = packageRes.package;
  if (!pkg || pkg.status !== 1 || pkg.type !== "item_listing") {
    throw new PayPalConfirmationError("Package not found", 404);
  }

  const { order, paypalCfg } = await fetchPayPalOrder(effectiveOrderId);

  const unit = order.purchase_units?.[0];
  const customId = unit?.custom_id || unit?.reference_id;
  const custom = parsePayPalCustomId(customId);
  if (custom.txId && custom.txId !== tx.id) {
    throw new PayPalConfirmationError("Order mismatch", 400);
  }
  if (custom.userId && custom.userId !== userId) {
    throw new PayPalConfirmationError("Order mismatch", 400);
  }

  let finalOrder = order;
  if (order.status === "APPROVED") {
    finalOrder = await paypalRequest<PayPalOrder>(paypalCfg, `/v2/checkout/orders/${effectiveOrderId}/capture`, {
      method: "POST",
    });
  }

  if (finalOrder.status !== "COMPLETED") {
    throw new PayPalConfirmationError("Payment not completed", 409);
  }

  const expectedAmount = Number(pkg.finalPrice ?? 0);
  const captureAmount =
    finalOrder.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ??
    finalOrder.purchase_units?.[0]?.amount?.value ??
    order.purchase_units?.[0]?.amount?.value;
  const actualAmount = normalizeAmount(captureAmount);
  if (!amountsMatch(expectedAmount, actualAmount)) {
    throw new PayPalConfirmationError("Amount mismatch", 400);
  }

  const currency =
    finalOrder.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code ??
    finalOrder.purchase_units?.[0]?.amount?.currency_code ??
    order.purchase_units?.[0]?.amount?.currency_code;
  if (currency && currency.toUpperCase() !== paypalCfg.currencyCode) {
    throw new PayPalConfirmationError("Currency mismatch", 400);
  }

  await panelInternalPost(`payment/transactions/${tx.id}/activate`, {
    userId,
    body: { orderId: tx.orderId ?? effectiveOrderId },
  });

  return { ok: true as const, alreadyConfirmed: false as const };
}
