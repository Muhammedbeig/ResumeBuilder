import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { json } from "@/lib/json";
import { panelInternalPost, PanelInternalApiError } from "@/lib/panel-internal-api";
import { getSessionUserId } from "@/lib/session-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InternalReceiptResponse = {
  transaction: {
    id: string;
    orderId: string | null;
    paymentStatus: string;
    paymentReceipt: string | null;
    amount: number;
    packageId: string | null;
    createdAt: string;
  };
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = getSessionUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const payload = new FormData();
  const packageId = formData.get("packageId");
  const file = formData.get("file");

  if (typeof packageId === "string") {
    payload.set("packageId", packageId);
  }
  if (file instanceof File) {
    payload.set("file", file);
  }

  try {
    const data = await panelInternalPost<InternalReceiptResponse>("bank-transfer/receipt", {
      userId,
      body: payload,
    });

    return json({ transaction: data.transaction });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to upload bank transfer receipt" }, { status: 500 });
  }
}
