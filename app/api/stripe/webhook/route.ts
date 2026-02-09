import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const headerList = await headers();
  const signature = headerList.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clientReferenceId = session.client_reference_id || undefined;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;

        const userId =
          clientReferenceId && /^\d+$/.test(clientReferenceId)
            ? BigInt(clientReferenceId)
            : null;

        const user = userId
          ? await prisma.user.findUnique({ where: { id: userId } })
          : customerId
          ? await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
          : null;

        if (user) {
          // We only persist Stripe linkage for now. Entitlements will be driven by Panel packages later.
          if (customerId && user.stripeCustomerId !== customerId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { stripeCustomerId: customerId },
            });
          }
        }
        break;
      }
      case "invoice.payment_succeeded": {
        // Entitlements are not synced from Stripe yet.
        break;
      }
      case "customer.subscription.deleted": {
        // Entitlements are not synced from Stripe yet.
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
