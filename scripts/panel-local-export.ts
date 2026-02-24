import fs from "node:fs/promises";
import path from "node:path";

import { coverLetterTemplates } from "@/lib/cover-letter-templates";
import { cvTemplateMap } from "@/lib/cv-templates";
import { envInt } from "@/lib/env";
import { runPdfRenderTask } from "@/lib/pdf-engine/queue";
import { renderPdfBuffer } from "@/lib/pdf-engine/render";
import { extractPdfText } from "@/lib/pdf-text";
import { panelGet } from "@/lib/panel-api";
import {
  mapCvConfigToResumeConfig,
  normalizeCoverLetterConfig,
  normalizeResumeConfig,
  type PanelTemplate,
} from "@/lib/panel-templates";
import { resumeTemplateMap } from "@/lib/resume-templates";
import { ResumeDataSchema } from "@/lib/resume-schema";
import type { CoverLetterData } from "@/types";

type DocType = "resume" | "cv" | "cover_letter";

type RunnerResult =
  | {
      ok: true;
      status: number;
      json: unknown;
    }
  | {
      ok: true;
      status: number;
      contentType: string;
      bodyBase64: string;
      headers?: Record<string, string>;
    }
  | {
      ok: false;
      status: number;
      error: string;
      details?: unknown;
    };

function normalizeType(rawType: unknown): DocType {
  const value = typeof rawType === "string" ? rawType.trim() : "";
  if (value === "cv" || value === "cover_letter") return value;
  return "resume";
}

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

function maxPdfTextChars(): number {
  const configured = envInt("PDF_TEXT_LIMIT", 20_000);
  return Math.max(500, configured);
}

function truncateText(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit);
}

async function runExtract(filePath: string): Promise<RunnerResult> {
  try {
    const pdfBytes = await fs.readFile(filePath);
    const text = await extractPdfText(Buffer.from(pdfBytes), true);
    const limited = truncateText(text ?? "", maxPdfTextChars());
    return { ok: true, status: 200, json: { text: limited } };
  } catch {
    return { ok: false, status: 500, error: "Failed to extract text from PDF" };
  }
}

async function runGenerate(payload: Record<string, unknown>): Promise<RunnerResult> {
  const templateIdValue = String(payload.templateId ?? "").trim();
  if (!templateIdValue) {
    return { ok: false, status: 400, error: "Template ID is required" };
  }

  const normalizedType = normalizeType(payload.type ?? payload.docType);
  const payloadData = payload.data;

  const concurrency = Math.max(1, envInt("PDF_RENDER_CONCURRENCY", 2));
  const timeoutMs = Math.max(1_000, envInt("PDF_RENDER_TIMEOUT_MS", 45_000));

  if (normalizedType === "cover_letter") {
    const coverData = normalizeCoverLetterData(payloadData);
    if (!coverData) {
      return { ok: false, status: 400, error: "Invalid cover letter data" };
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
      return { ok: false, status: 400, error: "Invalid template ID" };
    }

    try {
      const pdfBuffer = await runPdfRenderTask(
        () =>
          renderPdfBuffer({
            type: "cover_letter",
            templateId: templateIdValue,
            data: coverData,
            config: normalizeCoverLetterConfig((panelConfig ?? undefined) as any),
          }),
        {
          concurrency,
          timeoutMs,
        },
      );

      return {
        ok: true,
        status: 200,
        contentType: "application/pdf",
        bodyBase64: Buffer.from(pdfBuffer).toString("base64"),
        headers: {
          "Content-Disposition": `attachment; filename="cover-letter-${templateIdValue}.pdf"`,
        },
      };
    } catch {
      return { ok: false, status: 500, error: "Failed to generate PDF" };
    }
  }

  const parsedData = ResumeDataSchema.safeParse(payloadData);
  if (!parsedData.success) {
    return {
      ok: false,
      status: 400,
      error: "Invalid resume data",
      details: parsedData.error.issues,
    };
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
    return { ok: false, status: 400, error: "Invalid template ID" };
  }

  const resolvedConfig = isCv
    ? mapCvConfigToResumeConfig((panelConfig ?? undefined) as any, templateIdValue)
    : normalizeResumeConfig((panelConfig ?? undefined) as any, templateIdValue);

  try {
    const pdfBuffer = await runPdfRenderTask(
      () =>
        renderPdfBuffer({
          type: isCv ? "cv" : "resume",
          templateId: templateIdValue,
          data: parsedData.data,
          config: resolvedConfig ?? undefined,
        }),
      {
        concurrency,
        timeoutMs,
      },
    );

    return {
      ok: true,
      status: 200,
      contentType: "application/pdf",
      bodyBase64: Buffer.from(pdfBuffer).toString("base64"),
      headers: {
        "Content-Disposition": `attachment; filename="${isCv ? "cv" : "resume"}-${templateIdValue}.pdf"`,
      },
    };
  } catch {
    return { ok: false, status: 500, error: "Failed to generate PDF" };
  }
}

async function main() {
  const [, , modeRaw, payloadPathRaw, filePathRaw] = process.argv;
  const mode = String(modeRaw ?? "").trim().toLowerCase();
  const payloadPath = String(payloadPathRaw ?? "").trim();
  const filePath = String(filePathRaw ?? "").trim();

  if (!mode || !payloadPath) {
    const error: RunnerResult = {
      ok: false,
      status: 400,
      error: "Usage: panel-local-export.ts <mode> <payload-json-path> [file-path]",
    };
    process.stdout.write(JSON.stringify(error));
    process.exit(1);
    return;
  }

  let payload: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(path.resolve(payloadPath), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    payload = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    const error: RunnerResult = { ok: false, status: 400, error: "Invalid payload JSON" };
    process.stdout.write(JSON.stringify(error));
    process.exit(1);
    return;
  }

  let result: RunnerResult;
  if (mode === "extract") {
    if (!filePath) {
      result = { ok: false, status: 400, error: "No file provided" };
    } else {
      result = await runExtract(path.resolve(filePath));
    }
  } else if (mode === "generate") {
    result = await runGenerate(payload);
  } else {
    result = { ok: false, status: 400, error: "Unknown mode" };
  }

  process.stdout.write(JSON.stringify(result));
  process.exit(result.ok ? 0 : 1);
}

void main();

