import type { CoverLetterData } from "@/types";
import { RichText } from "@/components/editor/RichText";
import { getFontScale } from "@/lib/typography";
import type { CoverLetterTemplateConfig } from "@/lib/panel-templates";

interface CoverLetterCatalogTemplateProps {
  data: CoverLetterData;
  config: CoverLetterTemplateConfig;
  className?: string;
}

export function CoverLetterCatalogTemplate({ data, config, className = "" }: CoverLetterCatalogTemplateProps) {
  const themeColor = data.metadata?.themeColor || config.accentColor || "#0f172a";
  const bodyFont = data.metadata?.fontFamily || config.bodyFont || "Inter";
  const headingFont = config.headingFont || bodyFont;
  const fontSize = data.metadata?.fontSize;
  const scale = getFontScale(fontSize);
  const headerAlign = config.headerStyle === "center" ? "text-center" : "text-left";

  const SectionSeparator = () => {
    if (config.sectionSeparator === "line") {
      return <div className="my-6 h-px w-full" style={{ backgroundColor: themeColor }} />;
    }
    if (config.sectionSeparator === "bar") {
      return <div className="my-6 h-1 w-16" style={{ backgroundColor: themeColor }} />;
    }
    return null;
  };

  const HeaderBlock = () => (
    <div className={`mb-8 ${headerAlign}`}>
      <h1
        className="text-3xl font-bold"
        style={{ fontFamily: `"${headingFont}", serif`, color: themeColor }}
      >
        {data.personalInfo.fullName}
      </h1>
      <div className="mt-2 text-sm text-gray-600">
        <p>
          {data.personalInfo.email} | {data.personalInfo.phone}
        </p>
        <p>
          {data.personalInfo.address}, {data.personalInfo.city} {data.personalInfo.zipCode}
        </p>
      </div>
    </div>
  );

  const RecipientBlock = () => (
    <div className="mb-6 text-sm text-gray-700">
      <p className="font-semibold" style={{ color: themeColor }}>
        {data.recipientInfo.managerName}
      </p>
      <p>{data.recipientInfo.companyName}</p>
      <p>{data.recipientInfo.address}</p>
      <p>
        {data.recipientInfo.city} {data.recipientInfo.zipCode}
      </p>
    </div>
  );

  const ContentBlock = () => (
    <div className="space-y-4 text-sm leading-relaxed text-gray-800">
      <div className="font-semibold" style={{ color: themeColor }}>
        Subject: <RichText inline text={data.content.subject} />
      </div>
      <RichText inline text={data.content.greeting} />
      <RichText text={data.content.opening} />
      <RichText text={data.content.body} />
      <RichText text={data.content.closing} />
      <div className="pt-4 text-base font-semibold" style={{ color: themeColor }}>
        <RichText inline text={data.content.signature} />
      </div>
    </div>
  );

  return (
    <div
      className={`resume-template bg-white text-black min-h-[11in] p-10 ${className}`}
      style={{ fontFamily: `"${bodyFont}", sans-serif`, zoom: scale }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${bodyFont.replace(/ /g, '+')}:wght@300;400;500;700&family=${headingFont.replace(/ /g, '+')}:wght@400;600;700&display=swap');
      `}</style>

      {config.layout === "split" ? (
        <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
          <div>
            <HeaderBlock />
            <RecipientBlock />
          </div>
          <div>
            <SectionSeparator />
            <ContentBlock />
          </div>
        </div>
      ) : (
        <div>
          <HeaderBlock />
          {config.layout === "modern" && (
            <div className="mb-6 border-l-4 pl-4" style={{ borderColor: themeColor }}>
              <RecipientBlock />
            </div>
          )}
          {config.layout !== "modern" && <RecipientBlock />}
          <SectionSeparator />
          <ContentBlock />
        </div>
      )}
    </div>
  );
}