import type { ComponentType } from "react";
import type { ResumeData, CoverLetterData } from "@/types";
import { resumeTemplateMap } from "@/lib/resume-templates";
import { cvTemplateMap } from "@/lib/cv-templates";
import { coverLetterTemplates } from "@/lib/cover-letter-templates";
import { CatalogTemplate } from "@/components/resume/templates/catalog/CatalogTemplate";
import { CoverLetterCatalogTemplate } from "@/components/cover-letter/templates/CoverLetterCatalogTemplate";
import {
  normalizeResumeConfig,
  mapCvConfigToResumeConfig,
  normalizeCoverLetterConfig,
  type ResumeTemplateConfig,
  type CvTemplateConfig,
  type CoverLetterTemplateConfig,
} from "@/lib/panel-templates";

export function resolveResumeTemplateComponent(
  templateId: string,
  config?: ResumeTemplateConfig | null
): ComponentType<{ data: ResumeData; className?: string }> {
  const staticComponent = resumeTemplateMap[templateId as keyof typeof resumeTemplateMap];
  if (staticComponent) return staticComponent;

  const resolvedConfig = normalizeResumeConfig(config ?? undefined, templateId);
  if (!resolvedConfig) return resumeTemplateMap.modern;

  const Component: ComponentType<{ data: ResumeData; className?: string }> = ({ data, className }) => (
    <CatalogTemplate data={data} config={resolvedConfig} className={className} />
  );
  Component.displayName = `CatalogTemplate_${templateId}`;
  return Component;
}

export function resolveCvTemplateComponent(
  templateId: string,
  config?: CvTemplateConfig | null
): ComponentType<{ data: ResumeData; className?: string }> {
  const staticComponent = cvTemplateMap[templateId as keyof typeof cvTemplateMap];
  if (staticComponent) return staticComponent;

  const mapped = mapCvConfigToResumeConfig(config ?? undefined, templateId);
  if (!mapped) return cvTemplateMap["academic-cv"];

  const Component: ComponentType<{ data: ResumeData; className?: string }> = ({ data, className }) => (
    <CatalogTemplate data={data} config={mapped} className={className} />
  );
  Component.displayName = `CvCatalogTemplate_${templateId}`;
  return Component;
}

export function resolveCoverLetterTemplateComponent(
  templateId: string,
  config?: CoverLetterTemplateConfig | null
): ComponentType<{ data: CoverLetterData; className?: string }> {
  const staticComponent = coverLetterTemplates.find((t) => t.id === templateId)?.component;
  if (staticComponent) return staticComponent;

  const resolved = normalizeCoverLetterConfig(config ?? undefined);

  const Component: ComponentType<{ data: CoverLetterData; className?: string }> = ({ data, className }) => (
    <CoverLetterCatalogTemplate data={data} config={resolved} className={className} />
  );
  Component.displayName = `CoverLetterCatalogTemplate_${templateId}`;
  return Component;
}
