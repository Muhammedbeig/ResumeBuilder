import { NextRequest, NextResponse } from "next/server";
import { panelGet } from "@/lib/panel-api";
import type { PanelTemplate } from "@/lib/panel-templates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await context.params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? undefined;

  try {
    const res = await panelGet<PanelTemplate>(`templates/${templateId}`, type ? { type } : undefined);
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: true, message: "Failed to fetch template" }, { status: 500 });
  }
}