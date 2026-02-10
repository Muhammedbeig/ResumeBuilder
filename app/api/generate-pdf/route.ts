import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { resumeTemplateMap } from "@/lib/resume-templates";
import { panelGet } from "@/lib/panel-api";
import type { PanelTemplate } from "@/lib/panel-templates";
import { resolveResumeTemplateComponent } from "@/lib/template-resolvers";
import { normalizeResumeConfig } from "@/lib/panel-templates";
import { ResumeDataSchema } from "@/lib/resume-schema";
import React from "react";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const expectedKey = process.env.INTERNAL_EXPORT_KEY;
  const providedKey = req.headers.get("x-internal-export-key");
  if (!expectedKey) {
    return NextResponse.json({ error: "Export key is not configured" }, { status: 500 });
  }
  if (providedKey !== expectedKey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    const isStatic = !!resumeTemplateMap[templateId as keyof typeof resumeTemplateMap];
    let panelConfig: unknown = undefined;
    if (!isStatic) {
      try {
        const res = await panelGet<PanelTemplate>(`templates/${templateId}`, { type: "resume" });
        panelConfig = res.data?.config;
      } catch {
        panelConfig = undefined;
      }
    }

    const normalizedConfig = normalizeResumeConfig(panelConfig as any, templateId);
    if (!isStatic && !normalizedConfig) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const TemplateComponent = resolveResumeTemplateComponent(templateId, panelConfig as any);

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
    
    // Set content and wait for basic network tasks
    await page.setContent(fullHtml, { waitUntil: ["networkidle0", "load", "domcontentloaded"] });

    // Ensure all images are fully loaded and decoded
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
        })
      );
      // Wait for a short moment after images load for any reflow
      await new Promise(r => setTimeout(r, 500));
    });

    // Wait for fonts
    await page.evaluateHandle('document.fonts.ready');

    // Extra sleep for good measure
    await new Promise(r => setTimeout(r, 500));

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

