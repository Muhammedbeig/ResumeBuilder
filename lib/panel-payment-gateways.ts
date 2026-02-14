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

export async function getGatewayConfigs(): Promise<{
  stripe: StripeGatewayConfig | null;
  paypal: PayPalGatewayConfig | null;
}> {
  const data = await readGatewayConfig();
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
