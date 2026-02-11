import { json } from "@/lib/json";
import { getPayPalGatewayConfig, getStripeGatewayConfig } from "@/lib/panel-payment-gateways";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [stripeCfg, paypalCfg] = await Promise.all([
    getStripeGatewayConfig(),
    getPayPalGatewayConfig(),
  ]);

  return json({
    stripeEnabled: Boolean(stripeCfg),
    paypalEnabled: Boolean(paypalCfg),
  });
}
