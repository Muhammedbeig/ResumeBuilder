import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getPaidPlanById, type PaidPlanId } from "@/lib/pricing-plans";
import { parseUserIdBigInt } from "@/lib/user-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resolveBaseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

const resolveReturnUrl = (returnUrl: string | undefined, baseUrl: string) => {
  if (!returnUrl) return baseUrl;
  try {
    const base = new URL(baseUrl);
    if (returnUrl.startsWith("/")) {
      return new URL(returnUrl, base).toString();
    }
    const candidate = new URL(returnUrl);
    if (candidate.origin === base.origin) {
      return candidate.toString();
    }
  } catch {
    // ignore invalid URL
  }
  return baseUrl;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseUserIdBigInt(session.user.id);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId, returnUrl } = (await request.json()) as {
    planId?: PaidPlanId;
    returnUrl?: string;
  };

  if (!planId) {
    return NextResponse.json({ error: "Missing planId" }, { status: 400 });
  }

  const plan = getPaidPlanById(planId);
  if (!plan) {
    return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
  }

  const stripe = getStripe();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { userId: user.id.toString() },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = resolveBaseUrl();
  const resolvedReturnUrl = resolveReturnUrl(returnUrl, baseUrl);
  const successUrl = new URL(resolvedReturnUrl);
  successUrl.searchParams.set("stripe", "success");
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

  const cancelUrl = new URL(resolvedReturnUrl);
  cancelUrl.searchParams.set("stripe", "cancel");

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id.toString(),
    metadata: {
      userId: user.id.toString(),
      planId: plan.planId,
    },
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
    allow_promotion_codes: true,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.amountCents,
          recurring: { interval: plan.interval },
          product_data: {
            name: plan.name,
            description: plan.description,
          },
        },
      },
    ],
    subscription_data: {
      metadata: {
        userId: user.id.toString(),
        planId: plan.planId,
      },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
