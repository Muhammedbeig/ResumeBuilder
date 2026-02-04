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
