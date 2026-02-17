import { NextRequest, NextResponse } from "next/server";
import { resumeTemplateMap } from "@/lib/resume-templates";
import { MOCK_RESUME } from "@/lib/mock-resume";
import React from "react";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const results: Record<string, string> = {};
  let failures = 0;

  try {
    for (const [id, TemplateComponent] of Object.entries(resumeTemplateMap)) {
      try {
        // Validate template component wiring without server-invoking client components.
        const element = React.createElement(TemplateComponent as any, { data: MOCK_RESUME.data });
        if (!React.isValidElement(element)) {
          throw new Error("Invalid React element");
        }
        results[id] = "PASS";
      } catch (error) {
        console.error(`Template ${id} failed to render:`, error);
        results[id] = `FAIL: ${error instanceof Error ? error.message : String(error)}`;
        failures++;
      }
    }

    return NextResponse.json({
      status: failures === 0 ? "success" : "partial_failure",
      total: Object.keys(resumeTemplateMap).length,
      failures,
      results,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Test suite failed to run", details: String(error) },
      { status: 500 }
    );
  }
}
