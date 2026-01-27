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
    // Dynamic import to avoid build-time issues, same as generate-pdf
    const { renderToStaticMarkup } = await import("react-dom/server");

    for (const [id, TemplateComponent] of Object.entries(resumeTemplateMap)) {
      try {
        // Attempt to render the template with MOCK_RESUME data
        renderToStaticMarkup(
          React.createElement(TemplateComponent, { data: MOCK_RESUME.data })
        );
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
