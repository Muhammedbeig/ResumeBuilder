import { resumeTemplateMap } from "@/lib/resume-templates";
import type { ResumeData } from "@/types";

interface ResumePreviewComponentProps {
  data: ResumeData;
  templateId: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ResumePreviewComponent({ data, templateId, className, style }: ResumePreviewComponentProps) {
  const ActiveTemplate =
    resumeTemplateMap[templateId as keyof typeof resumeTemplateMap] ||
    resumeTemplateMap.modern;

  return (
    <div id="resume-preview" className={`bg-white shadow-2xl min-h-[1056px] w-[816px] text-black ${className || ''}`} style={style}>
      <ActiveTemplate data={data} />
    </div>
  );
}
