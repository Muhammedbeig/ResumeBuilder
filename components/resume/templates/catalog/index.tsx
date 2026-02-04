import type { ResumeData } from "@/types";
import type { ComponentType } from "react";
import { CatalogTemplate } from "./CatalogTemplate";
import { RESUME_TEMPLATE_CATALOG } from "@/lib/resume-template-catalog";

export type CatalogTemplateComponent = ComponentType<{
  data: ResumeData;
  className?: string;
}>;

export const catalogTemplateMap = RESUME_TEMPLATE_CATALOG.reduce(
  (acc, config) => {
    const Component: CatalogTemplateComponent = ({ data, className }) => (
      <CatalogTemplate data={data} config={config} className={className} />
    );
    Component.displayName = `${config.name.replace(/[^a-zA-Z0-9]/g, "")}CatalogTemplate`;
    acc[config.id] = Component;
    return acc;
  },
  {} as Record<string, CatalogTemplateComponent>
);
