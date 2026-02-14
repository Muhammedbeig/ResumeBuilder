import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { truncateText } from "@/lib/limits";
import { getResourceSettings } from "@/lib/resource-settings";
import { extractPdfText } from "@/lib/pdf-text";

export async function POST(request: Request) {
  try {
    const resourceSettings = await getResourceSettings();

    const rateLimitResponse = rateLimit(request, {
      prefix: "extract-pdf-text",
      limit: resourceSettings.rateLimits.pdf,
      windowMs: resourceSettings.rateLimits.windowMs,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractPdfText(buffer, true);

    const limitedText = truncateText(text, resourceSettings.limits.pdfText);
    return NextResponse.json({ text: limitedText });
  } catch (error) {
    console.error("PDF extraction error:", error);
    return NextResponse.json({ error: "Failed to extract text from PDF" }, { status: 500 });
  }
}
