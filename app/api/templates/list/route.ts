import { NextRequest, NextResponse } from "next/server";
import { panelGet } from "@/lib/panel-api";
import type { PanelTemplate } from "@/lib/panel-templates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  if (!type) {
    return NextResponse.json({ error: true, message: "type is required" }, { status: 400 });
  }

  const params: Record<string, string> = { type };
  const category = searchParams.get("category");
  if (category) params.category = category;
  const premium = searchParams.get("premium");
  if (premium !== null) params.premium = premium;
  const active = searchParams.get("active");
  if (active !== null) params.active = active;

  try {
    const res = await panelGet<PanelTemplate[]>("templates", params);
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: true, message: "Failed to fetch templates" }, { status: 500 });
  }
}