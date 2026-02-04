import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";

export async function requirePaidAiAccess() {
  const session = await getServerSession(authOptions);
  const subscription = session?.user?.subscription ?? "free";
  const cookieStore = await cookies();
  const planChoice = cookieStore.get("resupro_plan_choice")?.value;
  const hasPaidChoice = planChoice === "paid";
  const isSubscribed = subscription === "pro" || subscription === "business";

  if (!isSubscribed && !hasPaidChoice) {
    return NextResponse.json(
      { error: "AI is disabled for the free version." },
      { status: 402 }
    );
  }

  return null;
}

export async function requireAnnualAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAnnual = session.user.subscriptionPlanId === "annual";
  const isBusiness = session.user.subscription === "business";

  if (!isAnnual && !isBusiness) {
    return NextResponse.json(
      { error: "Annual plan required for Career Management reports." },
      { status: 402 }
    );
  }

  return null;
}
