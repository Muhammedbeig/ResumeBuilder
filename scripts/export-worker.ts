import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";

import { loadEnvConfig } from "@next/env";

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

loadEnvConfig(process.cwd());

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
      body: Buffer;
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

function jsonResponse(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function methodNotAllowed(res: ServerResponse) {
  jsonResponse(res, 405, { error: "Method not allowed" });
}

function notFound(res: ServerResponse) {
  jsonResponse(res, 404, { error: "Not found" });
}

function unauthorized(res: ServerResponse) {
  jsonResponse(res, 403, { error: "Forbidden" });
}

function expectedExportKey(): string {
  const key = process.env.INTERNAL_EXPORT_KEY ?? process.env.RESUME_BUILDER_EXPORT_KEY ?? "";
  return key.trim();
}

function hasValidExportKey(req: IncomingMessage): boolean {
  const expected = expectedExportKey();
  if (!expected) return false;
  const provided = String(req.headers["x-internal-export-key"] ?? "").trim();
  return provided === expected;
}

function getHeaderValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  return null;
}

function createWebRequest(req: IncomingMessage): Request {
  const host = getHeaderValue(req.headers.host) ?? "127.0.0.1";
  const url = new URL(req.url ?? "/", `http://${host}`);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    const normalized = getHeaderValue(value);
    if (!normalized) continue;
    headers.set(key, normalized);
  }

  const method = (req.method ?? "GET").toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return new Request(url.toString(), { method, headers });
  }

  return new Request(url.toString(), {
    method,
    headers,
    body: req as any,
    duplex: "half",
  } as RequestInit);
}

async function parseGeneratePayload(webRequest: Request): Promise<Record<string, unknown>> {
  const contentType = (webRequest.headers.get("content-type") ?? "").toLowerCase();

  if (contentType.includes("multipart/form-data")) {
    const form = await webRequest.formData();
    const payload: Record<string, unknown> = {};

    for (const [key, value] of form.entries()) {
      if (typeof value !== "string") continue;
      if (key === "data") {
        const trimmed = value.trim();
        if (!trimmed) {
          payload.data = trimmed;
          continue;
        }
        try {
          payload.data = JSON.parse(trimmed);
        } catch {
          payload.data = value;
        }
        continue;
      }
      payload[key] = value;
    }

    return payload;
  }

  if (contentType.includes("application/json")) {
    const body = (await webRequest.json().catch(() => ({}))) as unknown;
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return {};
  }

  const raw = await webRequest.text().catch(() => "");
  if (!raw.trim()) return {};

  try {
    const body = JSON.parse(raw) as unknown;
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
}

function sendRunnerResult(res: ServerResponse, result: RunnerResult) {
  if (!result.ok) {
    jsonResponse(res, result.status, {
      error: result.error,
      ...(result.details !== undefined ? { details: result.details } : {}),
    });
    return;
  }

  if ("json" in result) {
    jsonResponse(res, result.status, result.json);
    return;
  }

  res.statusCode = result.status;
  res.setHeader("Content-Type", result.contentType);
  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      res.setHeader(key, value);
    }
  }
  res.end(result.body);
}

async function runExtract(buffer: Buffer): Promise<RunnerResult> {
  try {
    const text = await extractPdfText(buffer, true);
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
        body: Buffer.from(pdfBuffer),
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
      body: Buffer.from(pdfBuffer),
      headers: {
        "Content-Disposition": `attachment; filename="${isCv ? "cv" : "resume"}-${templateIdValue}.pdf"`,
      },
    };
  } catch {
    return { ok: false, status: 500, error: "Failed to generate PDF" };
  }
}

async function handleExtract(req: IncomingMessage, res: ServerResponse) {
  if ((req.method ?? "").toUpperCase() !== "POST") {
    methodNotAllowed(res);
    return;
  }

  try {
    const webRequest = createWebRequest(req);
    const form = await webRequest.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      jsonResponse(res, 400, { error: "No file provided" });
      return;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await runExtract(buffer);
    sendRunnerResult(res, result);
  } catch {
    jsonResponse(res, 500, { error: "Failed to extract text from PDF" });
  }
}

async function handleGenerate(req: IncomingMessage, res: ServerResponse) {
  if ((req.method ?? "").toUpperCase() !== "POST") {
    methodNotAllowed(res);
    return;
  }

  if (!hasValidExportKey(req)) {
    unauthorized(res);
    return;
  }

  try {
    const webRequest = createWebRequest(req);
    const payload = await parseGeneratePayload(webRequest);
    const result = await runGenerate(payload);
    sendRunnerResult(res, result);
  } catch {
    jsonResponse(res, 500, { error: "Failed to generate PDF" });
  }
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const host = getHeaderValue(req.headers.host) ?? "127.0.0.1";
  const url = new URL(req.url ?? "/", `http://${host}`);
  const pathname = url.pathname;

  if (pathname === "/health") {
    jsonResponse(res, 200, { ok: true, service: "export-worker" });
    return;
  }

  if (pathname === "/extract-pdf-text") {
    await handleExtract(req, res);
    return;
  }

  if (pathname === "/generate-pdf") {
    await handleGenerate(req, res);
    return;
  }

  notFound(res);
}

async function main() {
  const host = process.env.RB_EXPORT_WORKER_HOST?.trim() || "127.0.0.1";
  const port = Math.max(1, envInt("RB_EXPORT_WORKER_PORT", 3101));

  const server = createServer((req, res) => {
    void handleRequest(req, res);
  });

  server.listen(port, host, () => {
    process.stdout.write(`Export worker listening on http://${host}:${port}\n`);
  });

  const close = () => {
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);
}

void main();

