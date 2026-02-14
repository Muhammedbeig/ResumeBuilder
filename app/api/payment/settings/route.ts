import { json } from "@/lib/json";
import { getGatewayConfigs } from "@/lib/panel-payment-gateways";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { stripe: stripeCfg, paypal: paypalCfg } = await getGatewayConfigs();

  return json({
    stripeEnabled: Boolean(stripeCfg),
    paypalEnabled: Boolean(paypalCfg),
  });
}
