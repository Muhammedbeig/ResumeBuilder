import "server-only";

import type { PayPalGatewayConfig } from "@/lib/panel-payment-gateways";

const PAYPAL_SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const PAYPAL_LIVE_BASE = "https://api-m.paypal.com";

export function resolvePayPalBaseUrl(mode: PayPalGatewayConfig["mode"]) {
  return mode === "live" ? PAYPAL_LIVE_BASE : PAYPAL_SANDBOX_BASE;
}

async function fetchPayPalAccessToken(
  config: PayPalGatewayConfig,
  baseUrl: string
): Promise<string> {
  const auth = Buffer.from(`${config.clientId}:${config.secretKey}`).toString("base64");
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as any) : null;
  if (!res.ok) {
    const message = json?.error_description || json?.message || "Unable to fetch PayPal token";
    throw new Error(`PayPal token error (${res.status}): ${message}`);
  }

  const token = json?.access_token;
  if (!token) {
    throw new Error("PayPal token missing access_token");
  }
  return token as string;
}

export async function paypalRequest<T>(
  config: PayPalGatewayConfig,
  path: string,
  init: RequestInit
): Promise<T> {
  const baseUrl = resolvePayPalBaseUrl(config.mode);
  const token = await fetchPayPalAccessToken(config, baseUrl);

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as T) : (null as T);
  if (!res.ok) {
    const message = (json as any)?.message || (json as any)?.error || "PayPal API error";
    throw new Error(`PayPal API error (${res.status}): ${message}`);
  }

  return json;
}
