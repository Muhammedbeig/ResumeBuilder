import { NextResponse } from "next/server";
import PDFParser from "pdf2json";
import { rateLimit } from "@/lib/rate-limit";
import { truncateText } from "@/lib/limits";
import { getResourceSettings } from "@/lib/resource-settings";

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
    const pdfParser = new PDFParser(null, true); // true = raw text parsing enabled

    const text = await new Promise<string>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        // pdfData is the raw JSON structure. We need to extract text from it.
        // But since we initialized with (null, 1), it might behave differently.
        // Actually, let's use the default output and map the pages.
        const rawText = pdfParser.getRawTextContent();
        resolve(rawText);
      });

      pdfParser.parseBuffer(buffer);
    });

    const limitedText = truncateText(text, resourceSettings.limits.pdfText);
    return NextResponse.json({ text: limitedText });
  } catch (error) {
    console.error("PDF extraction error:", error);
    return NextResponse.json({ error: "Failed to extract text from PDF" }, { status: 500 });
  }
}
