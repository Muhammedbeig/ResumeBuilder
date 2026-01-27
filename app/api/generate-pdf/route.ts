import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { resumeTemplateMap } from "@/lib/resume-templates";
import { ResumeDataSchema } from "@/lib/resume-schema";
import React from "react";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const body = await req.json();
    const { data, templateId } = body;

    // Validate Data
    const parsedData = ResumeDataSchema.safeParse(data);
    if (!parsedData.success) {
      return NextResponse.json(
        { error: "Invalid resume data", details: parsedData.error },
        { status: 400 }
      );
    }

    // Get Template
    const TemplateComponent = resumeTemplateMap[templateId as keyof typeof resumeTemplateMap];
    if (!TemplateComponent) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    // Render to HTML
    // We wrap it in a simple layout to ensure Tailwind works
    const componentHtml = renderToStaticMarkup(
      React.createElement(TemplateComponent, { data: parsedData.data })
    );

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
          /* Ensure the template takes full width/height if needed */
          .resume-template {
            min-height: 100vh;
            width: 100%;
          }
        </style>
      </head>
      <body>
        ${componentHtml}
      </body>
      </html>
    `;

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      pipe: true, // Use pipe instead of websocket (often more stable)
      dumpio: true, // Log browser output to console
    });

    const page = await browser.newPage();
    
    // Set content and wait for Tailwind to load (networkidle0 might be too strict if CDN is slow, but usually fine)
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    });

    await browser.close();

    // Return PDF
    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume-${templateId}.pdf"`,
      },
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
