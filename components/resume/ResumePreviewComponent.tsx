import { resolveResumeTemplateComponent } from "@/lib/template-resolvers";
import { normalizeResumeConfig } from "@/lib/panel-templates";
import type { ResumeData } from "@/types";
import { useMemo } from "react";

interface ResumePreviewComponentProps {
  data: ResumeData;
  templateId: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ResumePreviewComponent({ data, templateId, className, style }: ResumePreviewComponentProps) {
  const templateConfig = useMemo(() => normalizeResumeConfig(undefined, templateId), [templateId]);
  const ActiveTemplate = useMemo(
    () => resolveResumeTemplateComponent(templateId, templateConfig),
    [templateId, templateConfig]
  );

  return (
    <div id="resume-preview" className={`bg-white shadow-2xl min-h-[1056px] w-[816px] text-black ${className || ''}`} style={style}>
      <ActiveTemplate data={data} />
    </div>
  );
}
