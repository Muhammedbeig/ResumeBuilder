import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { json } from "@/lib/json";
import { panelInternalGet, PanelInternalApiError } from "@/lib/panel-internal-api";
import { getSessionUserId } from "@/lib/session-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Receipt = {
  id: string;
  packageId: string | null;
  packageName: string | null;
  amount: number;
  status: string;
  orderId: string | null;
  receiptPath: string | null;
  receiptUrl: string | null;
  createdAt: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await panelInternalGet<{ receipts: Receipt[] }>("bank-transfer/receipts", { userId });
    return json({ receipts: data.receipts ?? [] });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load receipts" }, { status: 500 });
  }
}
