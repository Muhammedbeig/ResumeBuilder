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
        const planId = session.metadata?.planId || undefined;

        const user = clientReferenceId
          ? await prisma.user.findUnique({ where: { id: clientReferenceId } })
          : customerId
          ? await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
          : null;

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscription: "pro",
              stripeCustomerId: customerId ?? user.stripeCustomerId,
              subscriptionPlanId: planId ?? user.subscriptionPlanId ?? null,
            },
          });
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        if (customerId) {
          let planId: string | null = null;
          const invoiceSubscription = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }).subscription;
          if (invoiceSubscription) {
            try {
              const stripe = getStripe();
              const subscription =
                typeof invoiceSubscription === "string"
                  ? await stripe.subscriptions.retrieve(invoiceSubscription)
                  : invoiceSubscription;
              planId = subscription.metadata?.planId || null;
            } catch (error) {
              console.error("Failed to retrieve subscription metadata", error);
            }
          }
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscription: "pro", subscriptionPlanId: planId ?? undefined },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : null;
        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscription: "free", subscriptionPlanId: null },
          });
        }
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
