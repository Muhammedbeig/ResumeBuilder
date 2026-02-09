import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Payments are handled via Panel packages / bank transfer for now.
  // This route is kept only to avoid breaking older clients.
  return NextResponse.json(
    { error: "Upgrade is not available via API yet." },
    { status: 501 }
  );
}
