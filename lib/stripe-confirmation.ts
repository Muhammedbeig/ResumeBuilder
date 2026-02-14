import "server-only";

import Stripe from "stripe";

import { getStripeGatewayConfig } from "@/lib/panel-payment-gateways";
import { panelInternalGet, panelInternalPost } from "@/lib/panel-internal-api";

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
  duration: string;
  itemLimit: string;
  listingDurationType: string | null;
  listingDurationDays: number | null;
  type: string;
  status: number;
};

export class StripeConfirmationError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "StripeConfirmationError";
    this.status = status;
  }
}

function isCheckoutSessionMismatch(checkoutSession: Stripe.Checkout.Session, tx: InternalTransaction, userId: string) {
  const md = checkoutSession.metadata ?? {};
  const mdTx = md.payment_transaction_id;
  const mdUser = md.user_id;
  const mdPkg = md.package_id;

  return (
    (typeof checkoutSession.client_reference_id === "string" && checkoutSession.client_reference_id !== userId) ||
    (mdTx && mdTx !== tx.id) ||
    (mdUser && mdUser !== userId) ||
    (mdPkg && mdPkg !== tx.packageId)
  );
}

function isPaymentIntentMismatch(paymentIntent: Stripe.PaymentIntent, tx: InternalTransaction, userId: string) {
  const md = paymentIntent.metadata ?? {};
  const mdTx = md.payment_transaction_id;
  const mdUser = md.user_id;
  const mdPkg = md.package_id;

  return (mdTx && mdTx !== tx.id) || (mdUser && mdUser !== userId) || (mdPkg && mdPkg !== tx.packageId);
}

async function findPaymentIntentByMetadata(
  stripe: Stripe,
  paymentTransactionId: string,
  userId: string,
  packageId: string | null
) {
  const queryParts = [
    `metadata['payment_transaction_id']:'${paymentTransactionId}'`,
    `metadata['user_id']:'${userId}'`,
  ];
  if (packageId) {
    queryParts.push(`metadata['package_id']:'${packageId}'`);
  }

  try {
    const searchResult = await stripe.paymentIntents.search({
      query: queryParts.join(" AND "),
      limit: 1,
    });
    if (searchResult.data[0]) {
      return searchResult.data[0];
    }
  } catch {
    // Some Stripe accounts do not support PI search yet.
  }

  let startingAfter: string | undefined;
  for (let page = 0; page < 4; page += 1) {
    const listResult = await stripe.paymentIntents.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    const match = listResult.data.find((intent) => {
      const md = intent.metadata ?? {};
      if (md.payment_transaction_id !== paymentTransactionId) return false;
      if (md.user_id !== userId) return false;
      if (packageId && md.package_id && md.package_id !== packageId) return false;
      return true;
    });

    if (match) {
      return match;
    }

    if (!listResult.has_more || listResult.data.length === 0) {
      break;
    }

    startingAfter = listResult.data[listResult.data.length - 1]?.id;
  }

  return null;
}

type ConfirmStripePaymentInput = {
  userId: string;
  paymentTransactionId: string;
  checkoutSessionId?: string | null;
};

export async function confirmStripePaymentTransaction({
  userId,
  paymentTransactionId,
  checkoutSessionId,
}: ConfirmStripePaymentInput) {
  const txRes = await panelInternalGet<{ transaction: InternalTransaction }>(`payment/transactions/${paymentTransactionId}`, {
    userId,
  });
  const tx = txRes.transaction;
  if (!tx) {
    throw new StripeConfirmationError("Transaction not found", 404);
  }

  if (String(tx.gateway ?? "").toLowerCase() !== "stripe") {
    throw new StripeConfirmationError("Invalid gateway", 400);
  }

  if (tx.status === "succeed") {
    return { ok: true as const, alreadyConfirmed: true as const };
  }

  if (!tx.packageId) {
    throw new StripeConfirmationError("Transaction missing packageId", 400);
  }

  const packageRes = await panelInternalGet<{ package: InternalPackage }>(`packages/${tx.packageId}`);
  const pkg = packageRes.package;
  if (!pkg || pkg.status !== 1 || pkg.type !== "item_listing") {
    throw new StripeConfirmationError("Package not found", 404);
  }

  const stripeCfg = await getStripeGatewayConfig();
  if (!stripeCfg) {
    throw new StripeConfirmationError("Stripe is not enabled or not configured in the Admin Panel.", 503);
  }

  const stripe = new Stripe(stripeCfg.secretKey, { typescript: true });
  const knownOrderId = String(tx.orderId ?? "").trim();
  const safeSessionId = String(checkoutSessionId ?? "").trim();
  let paymentIntentId: string | null = null;

  const resolveFromCheckoutSession = async (sessionId: string) => {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (isCheckoutSessionMismatch(checkoutSession, tx, userId)) {
      throw new StripeConfirmationError("Checkout session mismatch", 400);
    }

    if (checkoutSession.payment_status !== "paid") {
      throw new StripeConfirmationError("Payment not completed", 409);
    }

    paymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id ?? null;
  };

  if (safeSessionId) {
    await resolveFromCheckoutSession(safeSessionId);
  } else if (knownOrderId.startsWith("cs_")) {
    await resolveFromCheckoutSession(knownOrderId);
  } else {
    let paymentIntent: Stripe.PaymentIntent | null = null;

    if (knownOrderId.startsWith("pi_")) {
      paymentIntent = await stripe.paymentIntents.retrieve(knownOrderId);
    }

    if (!paymentIntent) {
      paymentIntent = await findPaymentIntentByMetadata(stripe, tx.id, userId, tx.packageId);
    }

    if (!paymentIntent) {
      throw new StripeConfirmationError("Payment intent not found for transaction", 404);
    }

    if (isPaymentIntentMismatch(paymentIntent, tx, userId)) {
      throw new StripeConfirmationError("Payment intent mismatch", 400);
    }

    if (paymentIntent.status !== "succeeded") {
      throw new StripeConfirmationError("Payment not completed", 409);
    }

    paymentIntentId = paymentIntent.id;
  }

  const orderIdForActivation = paymentIntentId ?? (knownOrderId.startsWith("pi_") ? knownOrderId : undefined);

  await panelInternalPost(`payment/transactions/${tx.id}/activate`, {
    userId,
    body: { orderId: orderIdForActivation },
  });

  return { ok: true as const, alreadyConfirmed: false as const };
}
