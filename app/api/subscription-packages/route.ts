import { json } from "@/lib/json";
import { fetchPricingCards } from "@/lib/panel-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cards = await fetchPricingCards();
  return json({ cards });
}

