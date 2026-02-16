import { json } from "@/lib/json";
import { getGatewayConfigs, getGatewayConfigsFromEnv } from "@/lib/panel-payment-gateways";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { stripe: stripeCfg, paypal: paypalCfg } = await getGatewayConfigs();

    return json({
      stripeEnabled: Boolean(stripeCfg),
      paypalEnabled: Boolean(paypalCfg),
    });
  } catch {
    const { stripe, paypal } = getGatewayConfigsFromEnv();
    return json({
      stripeEnabled: Boolean(stripe),
      paypalEnabled: Boolean(paypal),
    });
  }
}
