import "server-only";

import { panelInternalGet } from "@/lib/panel-internal-api";

export type StripeGatewayConfig = {
  currencyCode: string;
  publishableKey: string;
  secretKey: string;
  webhookSecretKey: string;
};

export type PayPalGatewayConfig = {
  currencyCode: string;
  clientId: string;
  secretKey: string;
  webhookId: string | null;
  mode: "live" | "sandbox";
};

type InternalGatewayResponse = {
  stripe: StripeGatewayConfig | null;
  paypal: PayPalGatewayConfig | null;
};

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

async function readGatewayConfig(): Promise<InternalGatewayResponse> {
  return panelInternalGet<InternalGatewayResponse>("payment/gateways");
}

function normalizeStripeGatewayConfig(stripe: StripeGatewayConfig | null | undefined): StripeGatewayConfig | null {
  if (!stripe) return null;
  const secretKey = String(stripe.secretKey ?? "").trim();
  if (!secretKey) return null;
  return {
    currencyCode: String(stripe.currencyCode ?? "usd").trim().toLowerCase(),
    publishableKey: String(stripe.publishableKey ?? "").trim(),
    secretKey,
    webhookSecretKey: String(stripe.webhookSecretKey ?? "").trim(),
  };
}

function normalizePayPalGatewayConfig(paypal: PayPalGatewayConfig | null | undefined): PayPalGatewayConfig | null {
  if (!paypal) return null;

  const clientId = String(paypal.clientId ?? "").trim();
  const secretKey = String(paypal.secretKey ?? "").trim();
  if (!clientId || !secretKey) return null;

  const modeRaw = String(paypal.mode ?? "")
    .trim()
    .toLowerCase();
  const mode: "live" | "sandbox" = modeRaw === "live" ? "live" : "sandbox";

  return {
    currencyCode: String(paypal.currencyCode ?? "USD").trim().toUpperCase(),
    clientId,
    secretKey,
    webhookId: String(paypal.webhookId ?? "").trim() || null,
    mode,
  };
}

function readStripeGatewayConfigFromEnv(): StripeGatewayConfig | null {
  const secretKey = normalizeText(process.env.STRIPE_SECRET_KEY);
  if (!secretKey) return null;

  return {
    currencyCode: normalizeText(process.env.STRIPE_CURRENCY || process.env.STRIPE_CURRENCY_CODE || "usd").toLowerCase(),
    publishableKey: normalizeText(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY),
    secretKey,
    webhookSecretKey: normalizeText(process.env.STRIPE_WEBHOOK_SECRET),
  };
}

function readPayPalGatewayConfigFromEnv(): PayPalGatewayConfig | null {
  const clientId = normalizeText(process.env.PAYPAL_CLIENT_ID);
  const secretKey = normalizeText(process.env.PAYPAL_SECRET_KEY || process.env.PAYPAL_SECRET);
  if (!clientId || !secretKey) return null;

  const modeRaw = normalizeText(process.env.PAYPAL_MODE || process.env.PAYPAL_ENV || "sandbox").toLowerCase();
  const mode: "live" | "sandbox" = modeRaw === "live" ? "live" : "sandbox";

  return {
    currencyCode: normalizeText(process.env.PAYPAL_CURRENCY || process.env.PAYPAL_CURRENCY_CODE || "USD").toUpperCase(),
    clientId,
    secretKey,
    webhookId: normalizeText(process.env.PAYPAL_WEBHOOK_ID) || null,
    mode,
  };
}

export function getGatewayConfigsFromEnv(): {
  stripe: StripeGatewayConfig | null;
  paypal: PayPalGatewayConfig | null;
} {
  return {
    stripe: readStripeGatewayConfigFromEnv(),
    paypal: readPayPalGatewayConfigFromEnv(),
  };
}

export async function getGatewayConfigs(): Promise<{
  stripe: StripeGatewayConfig | null;
  paypal: PayPalGatewayConfig | null;
}> {
  let data: InternalGatewayResponse | null = null;
  try {
    data = await readGatewayConfig();
  } catch {
    data = null;
  }

  if (!data) {
    return getGatewayConfigsFromEnv();
  }

  return {
    stripe: normalizeStripeGatewayConfig(data?.stripe),
    paypal: normalizePayPalGatewayConfig(data?.paypal),
  };
}

export async function getStripeGatewayConfig(): Promise<StripeGatewayConfig | null> {
  const gateways = await getGatewayConfigs();
  return gateways.stripe;
}

export async function getPayPalGatewayConfig(): Promise<PayPalGatewayConfig | null> {
  const gateways = await getGatewayConfigs();
  return gateways.paypal;
}
