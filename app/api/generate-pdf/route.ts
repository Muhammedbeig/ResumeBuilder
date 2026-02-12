import { NextRequest, NextResponse } from "next/server";
import { resumeTemplateMap } from "@/lib/resume-templates";
import { cvTemplateMap } from "@/lib/cv-templates";
import { coverLetterTemplates } from "@/lib/cover-letter-templates";
import { panelGet } from "@/lib/panel-api";
import type { PanelTemplate } from "@/lib/panel-templates";
import {
  resolveCoverLetterTemplateComponent,
  resolveCvTemplateComponent,
  resolveResumeTemplateComponent,
} from "@/lib/template-resolvers";
import { mapCvConfigToResumeConfig, normalizeResumeConfig } from "@/lib/panel-templates";
import { ResumeDataSchema } from "@/lib/resume-schema";
import React from "react";
import { withPuppeteerPage } from "@/lib/puppeteer";
import { rateLimit } from "@/lib/rate-limit";
import { getResourceSettings } from "@/lib/resource-settings";
import type { CoverLetterData } from "@/types";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DocType = "resume" | "cv" | "cover_letter";

function normalizeCoverLetterData(input: unknown): CoverLetterData | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, any>;
  const personal = raw.personalInfo ?? {};
  const recipient = raw.recipientInfo ?? {};
  const content = raw.content ?? {};

  return {
    personalInfo: {
      fullName: String(personal.fullName ?? ""),
      email: String(personal.email ?? ""),
      phone: String(personal.phone ?? ""),
      address: String(personal.address ?? ""),
      city: String(personal.city ?? ""),
      zipCode: String(personal.zipCode ?? ""),
    },
    recipientInfo: {
      managerName: String(recipient.managerName ?? ""),
      companyName: String(recipient.companyName ?? ""),
      address: String(recipient.address ?? ""),
      city: String(recipient.city ?? ""),
      zipCode: String(recipient.zipCode ?? ""),
      email: String(recipient.email ?? ""),
    },
    content: {
      subject: String(content.subject ?? ""),
      greeting: String(content.greeting ?? ""),
      opening: String(content.opening ?? ""),
      body: String(content.body ?? ""),
      closing: String(content.closing ?? ""),
      signature: String(content.signature ?? ""),
    },
    metadata: raw.metadata ?? {},
  };
}

export async function POST(req: NextRequest) {
  const expectedKey = process.env.INTERNAL_EXPORT_KEY;
  const providedKey = req.headers.get("x-internal-export-key");
  if (!expectedKey) {
    return NextResponse.json({ error: "Export key is not configured" }, { status: 500 });
  }
  if (providedKey !== expectedKey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const resourceSettings = await getResourceSettings();

  const rateLimitResponse = rateLimit(req, {
    prefix: "generate-pdf",
    limit: resourceSettings.rateLimits.puppeteer,
    windowMs: resourceSettings.rateLimits.windowMs,
  });
  if (rateLimitResponse) return rateLimitResponse;

  if (!resourceSettings.puppeteer.enabled) {
    return NextResponse.json({ error: "PDF export is temporarily unavailable" }, { status: 503 });
  }

  try {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const contentType = req.headers.get("content-type") ?? "";
    let body: Record<string, unknown> = {};
    let formHtml = "";
    let formTemplateId = "";
    let formType = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const htmlValue = formData.get("html");
      const templateValue = formData.get("templateId");
      const typeValue = formData.get("type");
      formHtml = typeof htmlValue === "string" ? htmlValue.trim() : "";
      formTemplateId = typeof templateValue === "string" ? templateValue.trim() : "";
      formType = typeof typeValue === "string" ? typeValue.trim() : "";
    } else {
      body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    }

    const { data, html, templateId, type, docType } = body ?? {};
    const clientHtml =
      formHtml || (typeof html === "string" ? html.trim() : "");
    const templateIdValue =
      formTemplateId || (typeof templateId === "string" ? templateId.trim() : "");
    const rawType =
      formType ||
      (typeof type === "string" ? type.trim() : "") ||
      (typeof docType === "string" ? docType.trim() : "");
    const normalizedType: DocType =
      rawType === "cv" || rawType === "cover_letter" ? rawType : "resume";
    const normalizedTemplateId =
      templateIdValue ||
      (normalizedType === "cv"
        ? "academic-cv"
        : normalizedType === "cover_letter"
          ? "modern"
          : "resume");

    if (!templateIdValue) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    let componentHtml = clientHtml;

    if (!componentHtml) {
      if (normalizedType === "cover_letter") {
        const coverLetterData = normalizeCoverLetterData(data);
        if (!coverLetterData) {
          return NextResponse.json({ error: "Invalid cover letter data" }, { status: 400 });
        }

        const isStatic = coverLetterTemplates.some((tpl) => tpl.id === templateIdValue);
        let panelConfig: unknown = undefined;
        if (!isStatic) {
          try {
            const res = await panelGet<PanelTemplate>(`templates/${templateIdValue}`, {
              type: "cover_letter",
            });
            panelConfig = res.data?.config;
          } catch {
            panelConfig = undefined;
          }
        }

        if (!isStatic && !panelConfig) {
          return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
        }

        const TemplateComponent = resolveCoverLetterTemplateComponent(
          templateIdValue || "modern",
          panelConfig as any
        );

        componentHtml = renderToStaticMarkup(
          React.createElement(TemplateComponent, { data: coverLetterData })
        );
      } else {
        // Resume/CV share the same data structure.
        const parsedData = ResumeDataSchema.safeParse(data);
        if (!parsedData.success) {
          return NextResponse.json(
            { error: "Invalid resume data", details: parsedData.error },
            { status: 400 }
          );
        }

        const isCv = normalizedType === "cv";
        const isStatic = isCv
          ? !!cvTemplateMap[templateIdValue as keyof typeof cvTemplateMap]
          : !!resumeTemplateMap[templateIdValue as keyof typeof resumeTemplateMap];

        let panelConfig: unknown = undefined;
        if (!isStatic) {
          try {
            const res = await panelGet<PanelTemplate>(`templates/${templateIdValue}`, {
              type: isCv ? "cv" : "resume",
            });
            panelConfig = res.data?.config;
          } catch {
            panelConfig = undefined;
          }
        }

        if (!isStatic && !panelConfig) {
          return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
        }

        const TemplateComponent = isCv
          ? resolveCvTemplateComponent(templateIdValue, panelConfig as any)
          : resolveResumeTemplateComponent(templateIdValue, panelConfig as any);

        componentHtml = renderToStaticMarkup(
          React.createElement(TemplateComponent, { data: parsedData.data })
        );
      }
    } else {
      componentHtml = `<div class="resume-template">${componentHtml}</div>`;
    }

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
    const pdfBuffer = await withPuppeteerPage(
      async (page) => {
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
        await new Promise((r) => setTimeout(r, 500));
      });

      // Wait for fonts
      await page.evaluateHandle("document.fonts.ready");

      // Extra sleep for good measure
      await new Promise((r) => setTimeout(r, 500));

      // Generate PDF
      return page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0px",
          right: "0px",
          bottom: "0px",
          left: "0px",
        },
      });
      },
      {
        concurrency: resourceSettings.puppeteer.concurrency,
        enabled: resourceSettings.puppeteer.enabled,
      }
    );

    // Return PDF
    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume-${normalizedTemplateId}.pdf"`,
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







