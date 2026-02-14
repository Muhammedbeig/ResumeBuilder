import { NextRequest, NextResponse } from "next/server";

import { coverLetterTemplates } from "@/lib/cover-letter-templates";
import { cvTemplateMap } from "@/lib/cv-templates";
import { runPdfRenderTask } from "@/lib/pdf-engine/queue";
import { renderPdfBuffer } from "@/lib/pdf-engine/render";
import { panelGet } from "@/lib/panel-api";
import {
  mapCvConfigToResumeConfig,
  normalizeCoverLetterConfig,
  normalizeResumeConfig,
  type PanelTemplate,
} from "@/lib/panel-templates";
import { rateLimit } from "@/lib/rate-limit";
import { getResourceSettings } from "@/lib/resource-settings";
import { resumeTemplateMap } from "@/lib/resume-templates";
import { ResumeDataSchema } from "@/lib/resume-schema";
import type { CoverLetterData } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function normalizeType(rawType: unknown): DocType {
  const value = typeof rawType === "string" ? rawType.trim() : "";
  if (value === "cv" || value === "cover_letter") return value;
  return "resume";
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
    limit: resourceSettings.rateLimits.pdfExport,
    windowMs: resourceSettings.rateLimits.windowMs,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let body: Record<string, unknown> = {};
    let formTemplateId = "";
    let formType = "";
    let formDataValue: unknown = undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const templateValue = form.get("templateId");
      const typeValue = form.get("type");
      const dataValue = form.get("data");

      formTemplateId = typeof templateValue === "string" ? templateValue.trim() : "";
      formType = typeof typeValue === "string" ? typeValue.trim() : "";

      if (typeof dataValue === "string" && dataValue.trim()) {
        try {
          formDataValue = JSON.parse(dataValue);
        } catch {
          formDataValue = dataValue;
        }
      } else {
        formDataValue = dataValue;
      }
    } else {
      body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    }

    const templateIdValue =
      formTemplateId || (typeof body.templateId === "string" ? body.templateId.trim() : "");
    if (!templateIdValue) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const normalizedType = normalizeType(formType || body.type || body.docType);
    const payloadData = formDataValue ?? body.data;

    if (normalizedType === "cover_letter") {
      const coverData = normalizeCoverLetterData(payloadData);
      if (!coverData) {
        return NextResponse.json({ error: "Invalid cover letter data" }, { status: 400 });
      }

      const isStatic = coverLetterTemplates.some((tpl) => tpl.id === templateIdValue);
      let panelConfig: unknown = null;
      if (!isStatic) {
        try {
          const res = await panelGet<PanelTemplate>(`templates/${templateIdValue}`, {
            type: "cover_letter",
          });
          panelConfig = res.data?.config;
        } catch {
          panelConfig = null;
        }
      }

      if (!isStatic && !panelConfig) {
        return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
      }

      const pdfBuffer = await runPdfRenderTask(
        () =>
          renderPdfBuffer({
            type: "cover_letter",
            templateId: templateIdValue,
            data: coverData,
            config: normalizeCoverLetterConfig((panelConfig ?? undefined) as any),
          }),
        {
          concurrency: resourceSettings.pdfRender.concurrency,
          timeoutMs: resourceSettings.pdfRender.timeoutMs,
        }
      );

      return new NextResponse(pdfBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="cover-letter-${templateIdValue}.pdf"`,
        },
      });
    }

    const parsedData = ResumeDataSchema.safeParse(payloadData);
    if (!parsedData.success) {
      return NextResponse.json({ error: "Invalid resume data", details: parsedData.error }, { status: 400 });
    }

    const isCv = normalizedType === "cv";
    const isStatic = isCv
      ? Boolean(cvTemplateMap[templateIdValue as keyof typeof cvTemplateMap])
      : Boolean(resumeTemplateMap[templateIdValue as keyof typeof resumeTemplateMap]);

    let panelConfig: unknown = null;
    if (!isStatic) {
      try {
        const res = await panelGet<PanelTemplate>(`templates/${templateIdValue}`, {
          type: isCv ? "cv" : "resume",
        });
        panelConfig = res.data?.config;
      } catch {
        panelConfig = null;
      }
    }

    if (!isStatic && !panelConfig) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
    }

    const resolvedConfig = isCv
      ? mapCvConfigToResumeConfig((panelConfig ?? undefined) as any, templateIdValue)
      : normalizeResumeConfig((panelConfig ?? undefined) as any, templateIdValue);

    const pdfBuffer = await runPdfRenderTask(
      () =>
        renderPdfBuffer({
          type: isCv ? "cv" : "resume",
          templateId: templateIdValue,
          data: parsedData.data,
          config: resolvedConfig ?? undefined,
        }),
      {
        concurrency: resourceSettings.pdfRender.concurrency,
        timeoutMs: resourceSettings.pdfRender.timeoutMs,
      }
    );

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${isCv ? "cv" : "resume"}-${templateIdValue}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
