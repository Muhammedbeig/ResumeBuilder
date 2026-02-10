import "server-only";

import { prisma } from "@/lib/prisma";

export type StripeGatewayConfig = {
  currencyCode: string; // lowercase ISO code for Stripe API
  publishableKey: string;
  secretKey: string;
  webhookSecretKey: string;
};

export async function getStripeGatewayConfig(): Promise<StripeGatewayConfig | null> {
  const row = await prisma.paymentConfiguration.findFirst({
    where: {
      paymentMethod: "Stripe",
      status: true,
    },
    select: {
      apiKey: true,
      secretKey: true,
      webhookSecretKey: true,
      currencyCode: true,
    },
  });

  if (!row) return null;

  const secretKey = String(row.secretKey ?? "").trim();
  if (!secretKey) return null;

  const publishableKey = String(row.apiKey ?? "").trim();
  const webhookSecretKey = String(row.webhookSecretKey ?? "").trim();
  const currencyCode = String(row.currencyCode ?? "USD")
    .trim()
    .toLowerCase();

  return {
    currencyCode,
    publishableKey,
    secretKey,
    webhookSecretKey,
  };
}