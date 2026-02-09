import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseUserIdBigInt } from "@/lib/user-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function durationToDays(durationRaw: string | null | undefined): number | null {
  const duration = String(durationRaw ?? "").trim().toLowerCase();
  if (!duration) return null;
  if (duration === "unlimited") return Number.POSITIVE_INFINITY;
  const days = Number.parseInt(duration, 10);
  return Number.isFinite(days) ? days : null;
}

function planIdFromDays(days: number | null): "weekly" | "monthly" | "annual" | null {
  if (!days) return null;
  if (days >= 365 || days === Number.POSITIVE_INFINITY) return "annual";
  if (days >= 28) return "monthly";
  return "weekly";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId = parseUserIdBigInt(session.user.id);
  if (userId) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existing) {
      userId = null;
    }
  }
  if (!userId && session.user.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }
  if (!userId && session.user.id) {
    const account = await prisma.account.findFirst({
      where: { providerAccountId: String(session.user.id) },
      select: { userId: true },
    });
    userId = account?.userId ?? null;
  }
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use UTC midnight to align with MySQL DATE columns and avoid timezone drift.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const active = await prisma.userPurchasedPackage.findMany({
    where: {
      userId,
      startDate: { lte: today },
      OR: [{ endDate: null }, { endDate: { gte: today } }],
      package: { type: "item_listing", status: 1 },
    },
    include: {
      package: { select: { finalPrice: true, duration: true } },
    },
    orderBy: { id: "desc" },
  });

  const paid = active.filter((p) => (p.package?.finalPrice ?? 0) > 0);
  if (paid.length === 0) {
    return NextResponse.json({ subscription: "free", subscriptionPlanId: null });
  }

  // Pick the "best" active package (longest duration; then highest price).
  const best = paid.reduce<(typeof paid)[number] | null>((acc, cur) => {
    if (!acc) return cur;
    const accDays = durationToDays(acc.package?.duration);
    const curDays = durationToDays(cur.package?.duration);
    if ((curDays ?? 0) > (accDays ?? 0)) return cur;
    if ((curDays ?? 0) < (accDays ?? 0)) return acc;
    return (cur.package?.finalPrice ?? 0) > (acc.package?.finalPrice ?? 0) ? cur : acc;
  }, null);

  const bestDays = durationToDays(best?.package?.duration);
  const subscriptionPlanId = planIdFromDays(bestDays);

  return NextResponse.json({
    subscription: "pro",
    subscriptionPlanId,
  });
}
