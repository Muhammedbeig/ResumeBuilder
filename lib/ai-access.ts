import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseUserIdBigInt } from "@/lib/user-id";

function durationToDays(durationRaw: string | null | undefined): number | null {
  const duration = String(durationRaw ?? "").trim().toLowerCase();
  if (!duration) return null;
  if (duration === "unlimited") return Number.POSITIVE_INFINITY;
  const days = Number.parseInt(duration, 10);
  return Number.isFinite(days) ? days : null;
}

export async function requirePaidAiAccess() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const planChoice = cookieStore.get("resupro_plan_choice")?.value;
  const hasPaidChoice = planChoice === "paid";

  const userId = parseUserIdBigInt(session?.user?.id ?? "");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activePaid = userId
    ? await prisma.userPurchasedPackage.findFirst({
        where: {
          userId,
          startDate: { lte: today },
          OR: [{ endDate: null }, { endDate: { gte: today } }],
          package: { type: "item_listing", status: 1, finalPrice: { gt: 0 } },
        },
        select: { id: true },
      })
    : null;

  const isSubscribed = Boolean(activePaid);

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

  const userId = parseUserIdBigInt(session.user.id);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const active = await prisma.userPurchasedPackage.findMany({
    where: {
      userId,
      startDate: { lte: today },
      OR: [{ endDate: null }, { endDate: { gte: today } }],
      package: { type: "item_listing", status: 1, finalPrice: { gt: 0 } },
    },
    include: { package: { select: { duration: true } } },
  });

  const bestDays = active.reduce<number | null>((acc, cur) => {
    const d = durationToDays(cur.package?.duration);
    if (d === null) return acc;
    if (acc === null) return d;
    return d > acc ? d : acc;
  }, null);

  const isAnnual = bestDays !== null && (bestDays >= 365 || bestDays === Number.POSITIVE_INFINITY);

  if (!isAnnual) {
    return NextResponse.json(
      { error: "Annual plan required for Career Management reports." },
      { status: 402 }
    );
  }

  return null;
}
