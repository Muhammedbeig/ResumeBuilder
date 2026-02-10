import { NextRequest, NextResponse } from "next/server";
import { panelGet } from "@/lib/panel-api";
import type { PanelTemplateCategory } from "@/lib/panel-templates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  if (!type) {
    return NextResponse.json({ error: true, message: "type is required" }, { status: 400 });
  }

  try {
    const res = await panelGet<PanelTemplateCategory[]>("template-categories", { type });
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: true, message: "Failed to fetch categories" }, { status: 500 });
  }
}