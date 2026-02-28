"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { resolveApiUrl } from "@/lib/client-api";
import {
  resolveCvTemplateComponent,
  resolveResumeTemplateComponent,
} from "@/lib/template-resolvers";
import { normalizeResumeData } from "@/lib/resume-data";
import type { ResumeData } from "@/types";
import { useRuntimeRouteParam } from "@/lib/use-runtime-route-param";

type SharedInternalResponse = {
  docType: "resume" | "cv";
  doc: {
    id: string;
    template: string;
  };
  latestVersionJson: Partial<ResumeData>;
};

type PanelTemplateRecord = {
  config?: unknown;
};

type SharedEnvelope = {
  error?: boolean;
  data?: unknown;
} & Record<string, unknown>;

function extractSharedPayload(payload: unknown): SharedInternalResponse | null {
  if (!payload || typeof payload !== "object") return null;

  const direct = payload as SharedInternalResponse;
  if (direct.docType && direct.doc && direct.latestVersionJson) {
    return direct;
  }

  const nested = (payload as SharedEnvelope).data;
  if (!nested || typeof nested !== "object") return null;

  const nestedDirect = nested as SharedInternalResponse;
  if (nestedDirect.docType && nestedDirect.doc && nestedDirect.latestVersionJson) {
    return nestedDirect;
  }

  return null;
}

function extractTemplateRecord(payload: unknown): PanelTemplateRecord | null {
  if (!payload || typeof payload !== "object") return null;

  const direct = payload as PanelTemplateRecord;
  if ("config" in direct) return direct;

  const nested = (payload as SharedEnvelope).data;
  if (!nested || typeof nested !== "object") return null;

  const nestedRecord = nested as PanelTemplateRecord;
  if ("config" in nestedRecord) return nestedRecord;

  return null;
}

async function fetchSharedDocument(id: string) {
  const url = resolveApiUrl(`/rb/shared/${encodeURIComponent(id)}`);
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  return extractSharedPayload(payload);
}

async function fetchTemplateConfig(type: "resume" | "cv", templateId: string) {
  const url = new URL(
    resolveApiUrl(`/rb/templates/${encodeURIComponent(templateId)}`),
    window.location.origin,
  );
  url.searchParams.set("type", type);

  const response = await fetch(url.toString(), {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  return extractTemplateRecord(payload);
}

export default function SharedDocumentPageClient() {
  const sharedId = useRuntimeRouteParam("/shared");

  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState<SharedInternalResponse | null>(null);
  const [templateRecord, setTemplateRecord] =
    useState<PanelTemplateRecord | null>(null);

  useEffect(() => {
    if (!sharedId || sharedId === "_") {
      setLoading(false);
      setShared(null);
      setTemplateRecord(null);
      return;
    }

    let active = true;
    setLoading(true);

    void (async () => {
      try {
        const nextShared = await fetchSharedDocument(sharedId);
        if (!active) return;

        setShared(nextShared);
        if (!nextShared?.doc?.template) {
          setTemplateRecord(null);
          return;
        }

        const nextTemplate = await fetchTemplateConfig(
          nextShared.docType,
          nextShared.doc.template,
        );
        if (!active) return;
        setTemplateRecord(nextTemplate);
      } catch {
        if (!active) return;
        setShared(null);
        setTemplateRecord(null);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [sharedId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-12 pt-[calc(var(--app-header-offset,88px)+1rem)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          Loading shared document...
        </div>
      </div>
    );
  }

  if (!shared || !shared.doc || !shared.latestVersionJson) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-12 pt-[calc(var(--app-header-offset,88px)+1rem)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          Shared document not found.
        </div>
      </div>
    );
  }

  const resumeData = normalizeResumeData(
    shared.latestVersionJson as Partial<ResumeData>,
  );

  const TemplateComponent =
    shared.docType === "resume"
      ? resolveResumeTemplateComponent(
          shared.doc.template,
          (templateRecord?.config as any) ?? undefined,
        )
      : resolveCvTemplateComponent(
          shared.doc.template,
          (templateRecord?.config as any) ?? undefined,
        );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-12 pt-[calc(var(--app-header-offset,88px)+1rem)] px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-gray-900 dark:text-white"
        >
          ResuPro
        </Link>
        <Link href="/">
          <Button variant="outline">
            Create Your Own {shared.docType === "resume" ? "Resume" : "CV"}
          </Button>
        </Link>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
        <TemplateComponent data={resumeData} />
      </div>

      <div className="max-w-4xl mx-auto mt-8 text-center text-sm text-gray-500">
        Generated with ResuPro AI Builder
      </div>
    </div>
  );
}
