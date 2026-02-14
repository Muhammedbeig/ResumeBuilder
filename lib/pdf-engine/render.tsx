import React from "react";
import { Document, Link, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";

import type {
  Certification,
  CoverLetterData,
  Education,
  Experience,
  Project,
  ResumeData,
  SectionConfig,
  SkillGroup,
} from "@/types";
import { getFontScale } from "@/lib/typography";
import type { CoverLetterTemplateConfig, ResumeTemplateConfig } from "@/lib/panel-templates";
import { normalizeCoverLetterConfig, normalizeResumeConfig } from "@/lib/panel-templates";

type ResumePdfInput = {
  type: "resume" | "cv";
  templateId: string;
  data: ResumeData;
  config?: ResumeTemplateConfig | null;
};

type CoverLetterPdfInput = {
  type: "cover_letter";
  templateId: string;
  data: CoverLetterData;
  config?: CoverLetterTemplateConfig | null;
};

export type PdfRenderInput = ResumePdfInput | CoverLetterPdfInput;

type RichBlock = { type: "paragraph"; text: string } | { type: "list"; items: string[] };

const DEFAULT_STRUCTURE: SectionConfig[] = [
  { id: "basics", type: "basics", title: "Personal Info", isVisible: true, order: 0 },
  { id: "summary", type: "summary", title: "Professional Summary", isVisible: true, order: 1 },
  { id: "experience", type: "experience", title: "Experience", isVisible: true, order: 2 },
  { id: "education", type: "education", title: "Education", isVisible: true, order: 3 },
  { id: "skills", type: "skills", title: "Skills", isVisible: true, order: 4 },
  { id: "projects", type: "projects", title: "Projects", isVisible: true, order: 5 },
  { id: "certifications", type: "certifications", title: "Certifications", isVisible: true, order: 6 },
];

const STATIC_TEMPLATE_STYLE_OVERRIDES: Record<string, Partial<ResumeTemplateConfig>> = {
  modern: { bodyFont: "Inter", headingFont: "Inter", sectionStyle: "underline", layout: "stacked" },
  ats: { bodyFont: "Inter", headingFont: "Inter", sectionStyle: "caps", layout: "stacked" },
  classic: { bodyFont: "Lora", headingFont: "Playfair Display", sectionStyle: "caps", layout: "stacked" },
  executive: { bodyFont: "Source Sans 3", headingFont: "Oswald", sectionStyle: "stripe", layout: "split" },
  professional: {
    bodyFont: "Merriweather",
    headingFont: "Playfair Display",
    sectionStyle: "underline",
    layout: "split",
  },
  creative: { bodyFont: "Nunito", headingFont: "Sora", sectionStyle: "pill", layout: "split" },
  impact: { bodyFont: "Inter", headingFont: "Bebas Neue", sectionStyle: "stripe", layout: "split" },
  minimal: { bodyFont: "Inter", headingFont: "Inter", sectionStyle: "caps", layout: "stacked" },
  "tech-modern": { bodyFont: "IBM Plex Sans", headingFont: "Space Grotesk", sectionStyle: "stripe", layout: "split" },
  "minimalist-photo": {
    bodyFont: "Inter",
    headingFont: "Inter",
    sectionStyle: "caps",
    layout: "sidebar-left",
    hasPhoto: true,
  },
  "minimalist-professional": {
    bodyFont: "Inter",
    headingFont: "Inter",
    sectionStyle: "underline",
    layout: "sidebar-left",
    hasPhoto: true,
  },
  "academic-cv": {
    bodyFont: "Merriweather",
    headingFont: "Playfair Display",
    sectionStyle: "caps",
    layout: "stacked",
  },
  "executive-cv": { bodyFont: "Inter", headingFont: "Oswald", sectionStyle: "stripe", layout: "split" },
  "minimalist-professional-cv": {
    bodyFont: "Inter",
    headingFont: "Inter",
    sectionStyle: "underline",
    layout: "sidebar-left",
    hasPhoto: true,
  },
};

const COVER_LETTER_TEMPLATE_OVERRIDES: Record<string, Partial<CoverLetterTemplateConfig>> = {
  modern: { layout: "modern", sectionSeparator: "line" },
  professional: { layout: "classic", sectionSeparator: "bar", headerStyle: "left" },
  creative: { layout: "split", sectionSeparator: "line" },
};

const SECTION_TITLES: Record<SectionConfig["type"], string> = {
  basics: "Personal Info",
  summary: "Professional Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  custom: "Section",
};

const FONT_FAMILIES = {
  sans: "Helvetica",
  serif: "Times-Roman",
  mono: "Courier",
} as const;

function pickPdfFont(fontName?: string | null): string {
  const value = String(fontName ?? "")
    .trim()
    .toLowerCase();
  if (!value) return FONT_FAMILIES.sans;

  if (
    value.includes("serif") ||
    value.includes("merriweather") ||
    value.includes("playfair") ||
    value.includes("garamond") ||
    value.includes("georgia") ||
    value.includes("lora")
  ) {
    return FONT_FAMILIES.serif;
  }

  if (
    value.includes("mono") ||
    value.includes("fira code") ||
    value.includes("courier") ||
    value.includes("consolas")
  ) {
    return FONT_FAMILIES.mono;
  }

  return FONT_FAMILIES.sans;
}

function normalizePdfColor(value: string | undefined | null, fallback: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
    return raw;
  }

  const rgb = /^rgba?\(([^)]+)\)$/i.exec(raw);
  if (!rgb) return fallback;
  const parts = rgb[1]
    .split(",")
    .map((part) => Number.parseFloat(part.trim()))
    .filter((part) => Number.isFinite(part));
  if (parts.length < 3) return fallback;
  const r = Math.max(0, Math.min(255, Math.round(parts[0])));
  const g = Math.max(0, Math.min(255, Math.round(parts[1])));
  const b = Math.max(0, Math.min(255, Math.round(parts[2])));
  return `rgb(${r}, ${g}, ${b})`;
}

function stripInlineFormatting(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1");
}

function parseRichBlocks(value: string): RichBlock[] {
  const lines = String(value ?? "").split(/\r?\n/);
  const blocks: RichBlock[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    const bulletMatch = /^[-*]\s+(.+)$/.exec(line);
    if (bulletMatch) {
      listItems.push(stripInlineFormatting(bulletMatch[1]));
      continue;
    }

    flushList();
    if (!line) continue;
    blocks.push({ type: "paragraph", text: stripInlineFormatting(line) });
  }

  flushList();
  return blocks;
}

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function activeStructure(structure: SectionConfig[] | undefined): SectionConfig[] {
  if (!Array.isArray(structure) || structure.length === 0) return DEFAULT_STRUCTURE;
  return [...structure].sort((a, b) => a.order - b.order);
}

function textOrFallback(value: string | undefined | null, fallback = ""): string {
  const next = String(value ?? "").trim();
  return next || fallback;
}

function scaleValue(base: number, scale: number): number {
  return Math.round(base * scale * 100) / 100;
}

function ResumeSectionHeading({
  title,
  sectionStyle,
  accentColor,
  headingFont,
  scale,
}: {
  title: string;
  sectionStyle: ResumeTemplateConfig["sectionStyle"];
  accentColor: string;
  headingFont: string;
  scale: number;
}) {
  if (sectionStyle === "pill") {
    return (
      <View
        style={{
          marginBottom: scaleValue(7, scale),
          alignSelf: "flex-start",
          borderRadius: 999,
          borderWidth: 1,
          borderColor: accentColor,
          paddingHorizontal: scaleValue(8, scale),
          paddingVertical: scaleValue(3, scale),
        }}
      >
        <Text
          style={{
            color: accentColor,
            fontFamily: headingFont,
            fontSize: scaleValue(9, scale),
            textTransform: "uppercase",
          }}
        >
          {title}
        </Text>
      </View>
    );
  }

  if (sectionStyle === "stripe") {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: scaleValue(7, scale),
          gap: scaleValue(5, scale),
        }}
      >
        <View
          style={{
            width: scaleValue(4, scale),
            height: scaleValue(14, scale),
            borderRadius: scaleValue(2, scale),
            backgroundColor: accentColor,
          }}
        />
        <Text
          style={{
            color: accentColor,
            fontFamily: headingFont,
            fontSize: scaleValue(11, scale),
            textTransform: "uppercase",
          }}
        >
          {title}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: scaleValue(7, scale) }}>
      <Text
        style={{
          color: accentColor,
          fontFamily: headingFont,
          fontSize: scaleValue(11, scale),
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
      {sectionStyle === "underline" ? (
        <View
          style={{
            marginTop: scaleValue(3, scale),
            width: scaleValue(44, scale),
            height: scaleValue(1.5, scale),
            backgroundColor: accentColor,
          }}
        />
      ) : null}
    </View>
  );
}

function RichBlocks({
  value,
  textColor,
  fontSize,
  lineHeight,
  fontFamily,
  scale,
}: {
  value: string;
  textColor: string;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  scale: number;
}) {
  const blocks = parseRichBlocks(value);
  if (blocks.length === 0) return null;

  return (
    <View style={{ gap: scaleValue(4, scale) }}>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <Text
              key={`p-${index}`}
              style={{
                color: textColor,
                fontSize,
                lineHeight,
                fontFamily,
              }}
            >
              {block.text}
            </Text>
          );
        }

        return (
          <View key={`l-${index}`} style={{ gap: scaleValue(3, scale) }}>
            {block.items.map((item, itemIndex) => (
              <Text
                key={`li-${itemIndex}`}
                style={{
                  color: textColor,
                  fontSize,
                  lineHeight,
                  fontFamily,
                }}
              >
                - {item}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function ResumePdfDocument({ input }: { input: ResumePdfInput }) {
  const override = STATIC_TEMPLATE_STYLE_OVERRIDES[input.templateId] ?? {};
  const normalized = normalizeResumeConfig(
    {
      ...(input.config ?? {}),
      ...override,
      id: input.config?.id ?? input.templateId,
      name: input.config?.name ?? input.templateId,
    },
    input.templateId
  );

  const config = normalized ?? normalizeResumeConfig(override, input.templateId);
  if (!config) {
    throw new Error("Unable to resolve template config for PDF rendering.");
  }

  const data = input.data;
  const structure = activeStructure(data.structure);
  const scale = getFontScale(data.metadata?.fontSize);
  const bodyFont = pickPdfFont(data.metadata?.fontFamily || config.bodyFont);
  const headingFont = pickPdfFont(config.headingFont);

  const accentColor = normalizePdfColor(data.metadata?.themeColor, "#111827");
  const textColor = normalizePdfColor(config.palette.text, "#111827");
  const mutedColor = normalizePdfColor(config.palette.muted, "#4b5563");
  const borderColor = normalizePdfColor(config.palette.border, "#e5e7eb");
  const surfaceColor = normalizePdfColor(config.palette.surface, "#ffffff");

  const pagePadding = scaleValue(28, scale);
  const sectionGap = scaleValue(12, scale);
  const bodyFontSize = scaleValue(10.6, scale);
  const smallFontSize = scaleValue(9.2, scale);
  const headingFontSize = scaleValue(30, scale);
  const subHeadingFontSize = scaleValue(12, scale);
  const lineHeight = scaleValue(1.45, scale);

  const contactItems = [
    data.basics.location,
    data.basics.email,
    data.basics.phone,
    data.basics.linkedin,
    data.basics.github,
    data.basics.portfolio,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  const renderExperience = (experiences: Experience[]) => (
    <View style={{ gap: scaleValue(10, scale) }}>
      {safeArray(experiences).map((exp, index) => (
        <View
          key={exp.id || `exp-${index}`}
          style={{
            borderBottomWidth: index === safeArray(experiences).length - 1 ? 0 : 0.6,
            borderBottomColor: borderColor,
            paddingBottom: scaleValue(8, scale),
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: scaleValue(8, scale),
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: textColor,
                  fontFamily: headingFont,
                  fontSize: scaleValue(11, scale),
                }}
              >
                {textOrFallback(exp.role, "Role")}
              </Text>
              <Text
                style={{
                  color: mutedColor,
                  fontFamily: bodyFont,
                  fontSize: smallFontSize,
                  marginTop: scaleValue(2, scale),
                }}
              >
                {[textOrFallback(exp.company), textOrFallback(exp.location)].filter(Boolean).join(" - ")}
              </Text>
            </View>
            <Text
              style={{
                color: mutedColor,
                fontFamily: bodyFont,
                fontSize: smallFontSize,
              }}
            >
              {textOrFallback(exp.startDate)} - {exp.current ? "Present" : textOrFallback(exp.endDate)}
            </Text>
          </View>
          <View style={{ marginTop: scaleValue(5, scale), gap: scaleValue(3, scale) }}>
            {safeArray(exp.bullets).map((bullet, bulletIndex) => (
              <Text
                key={`${exp.id || index}-b-${bulletIndex}`}
                style={{
                  color: textColor,
                  fontFamily: bodyFont,
                  fontSize: bodyFontSize,
                  lineHeight,
                }}
              >
                - {stripInlineFormatting(bullet)}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderEducation = (education: Education[]) => (
    <View style={{ gap: scaleValue(8, scale) }}>
      {safeArray(education).map((edu, index) => (
        <View key={edu.id || `edu-${index}`}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: textColor,
                  fontFamily: headingFont,
                  fontSize: scaleValue(11, scale),
                }}
              >
                {textOrFallback(edu.institution)}
              </Text>
              <Text
                style={{
                  color: mutedColor,
                  fontFamily: bodyFont,
                  fontSize: bodyFontSize,
                  marginTop: scaleValue(2, scale),
                }}
              >
                {[textOrFallback(edu.degree), textOrFallback(edu.field)].filter(Boolean).join(" in ")}
              </Text>
              {edu.gpa ? (
                <Text
                  style={{
                    color: mutedColor,
                    fontFamily: bodyFont,
                    fontSize: smallFontSize,
                    marginTop: scaleValue(2, scale),
                  }}
                >
                  GPA: {stripInlineFormatting(edu.gpa)}
                </Text>
              ) : null}
            </View>
            <Text
              style={{
                color: mutedColor,
                fontFamily: bodyFont,
                fontSize: smallFontSize,
              }}
            >
              {textOrFallback(edu.startDate)} - {textOrFallback(edu.endDate)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSkills = (skills: SkillGroup[]) => (
    <View style={{ gap: scaleValue(7, scale) }}>
      {safeArray(skills).map((group, index) => (
        <View key={group.id || `skill-${index}`}>
          <Text
            style={{
              color: textColor,
              fontFamily: headingFont,
              fontSize: smallFontSize,
            }}
          >
            {textOrFallback(group.name)}
          </Text>
          <Text
            style={{
              color: mutedColor,
              fontFamily: bodyFont,
              fontSize: bodyFontSize,
              lineHeight,
              marginTop: scaleValue(2, scale),
            }}
          >
            {safeArray(group.skills).join(", ")}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderProjects = (projects: Project[]) => (
    <View style={{ gap: scaleValue(8, scale) }}>
      {safeArray(projects).map((project, index) => (
        <View key={project.id || `project-${index}`}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: scaleValue(8, scale),
            }}
          >
            <Text
              style={{
                color: textColor,
                fontFamily: headingFont,
                fontSize: scaleValue(11, scale),
                flex: 1,
              }}
            >
              {textOrFallback(project.name)}
            </Text>
            {project.link ? (
              <Link
                src={project.link}
                style={{
                  color: accentColor,
                  fontFamily: bodyFont,
                  fontSize: smallFontSize,
                  textDecoration: "none",
                }}
              >
                View
              </Link>
            ) : null}
          </View>
          <View style={{ marginTop: scaleValue(3, scale) }}>
            <RichBlocks
              value={textOrFallback(project.description)}
              textColor={textColor}
              fontSize={bodyFontSize}
              lineHeight={lineHeight}
              fontFamily={bodyFont}
              scale={scale}
            />
          </View>
          {safeArray(project.technologies).length > 0 ? (
            <Text
              style={{
                color: mutedColor,
                fontFamily: bodyFont,
                fontSize: smallFontSize,
                marginTop: scaleValue(3, scale),
              }}
            >
              Technologies: {safeArray(project.technologies).join(", ")}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );

  const renderCertifications = (certs: Certification[]) => (
    <View style={{ gap: scaleValue(6, scale) }}>
      {safeArray(certs).map((cert, index) => (
        <View key={cert.id || `cert-${index}`}>
          <Text
            style={{
              color: textColor,
              fontFamily: headingFont,
              fontSize: scaleValue(11, scale),
            }}
          >
            {textOrFallback(cert.name)}
          </Text>
          <Text
            style={{
              color: mutedColor,
              fontFamily: bodyFont,
              fontSize: smallFontSize,
              marginTop: scaleValue(2, scale),
            }}
          >
            {[textOrFallback(cert.issuer), textOrFallback(cert.date)].filter(Boolean).join(" - ")}
          </Text>
          {cert.link ? (
            <Link
              src={cert.link}
              style={{
                color: accentColor,
                fontFamily: bodyFont,
                fontSize: smallFontSize,
                marginTop: scaleValue(2, scale),
                textDecoration: "none",
              }}
            >
              {cert.link}
            </Link>
          ) : null}
        </View>
      ))}
    </View>
  );

  const renderSection = (section: SectionConfig) => {
    if (section.isVisible === false) return null;
    const title = textOrFallback(section.title, SECTION_TITLES[section.type] || "Section");

    if (section.type === "basics") {
      return (
        <View key={section.id} style={{ marginBottom: sectionGap }}>
          <Text
            style={{
              color: accentColor,
              fontFamily: headingFont,
              fontSize: headingFontSize,
            }}
          >
            {textOrFallback(data.basics.name, "Your Name")}
          </Text>
          <Text
            style={{
              color: textColor,
              fontFamily: bodyFont,
              fontSize: subHeadingFontSize,
              marginTop: scaleValue(3, scale),
            }}
          >
            {textOrFallback(data.basics.title, "Professional Title")}
          </Text>
          {contactItems.length > 0 ? (
            <Text
              style={{
                color: mutedColor,
                fontFamily: bodyFont,
                fontSize: smallFontSize,
                marginTop: scaleValue(6, scale),
                lineHeight,
              }}
            >
              {contactItems.join("   ")}
            </Text>
          ) : null}
        </View>
      );
    }

    if (section.type === "summary") {
      const summary = textOrFallback(data.basics.summary);
      if (!summary) return null;
      return (
        <View key={section.id} style={{ marginBottom: sectionGap }}>
          <ResumeSectionHeading
            title={title}
            sectionStyle={config.sectionStyle}
            accentColor={accentColor}
            headingFont={headingFont}
            scale={scale}
          />
          <RichBlocks
            value={summary}
            textColor={textColor}
            fontSize={bodyFontSize}
            lineHeight={lineHeight}
            fontFamily={bodyFont}
            scale={scale}
          />
        </View>
      );
    }

    if (section.type === "experience") {
      if (safeArray(data.experiences).length === 0) return null;
      return (
        <View key={section.id} style={{ marginBottom: sectionGap }}>
          <ResumeSectionHeading
            title={title}
            sectionStyle={config.sectionStyle}
            accentColor={accentColor}
            headingFont={headingFont}
            scale={scale}
          />
          {renderExperience(data.experiences)}
        </View>
      );
    }

    if (section.type === "education") {
      if (safeArray(data.education).length === 0) return null;
      return (
        <View key={section.id} style={{ marginBottom: sectionGap }}>
          <ResumeSectionHeading
            title={title}
            sectionStyle={config.sectionStyle}
            accentColor={accentColor}
            headingFont={headingFont}
            scale={scale}
          />
          {renderEducation(data.education)}
        </View>
      );
    }

    if (section.type === "skills") {
      if (safeArray(data.skills).length === 0) return null;
      return (
        <View key={section.id} style={{ marginBottom: sectionGap }}>
          <ResumeSectionHeading
            title={title}
            sectionStyle={config.sectionStyle}
            accentColor={accentColor}
            headingFont={headingFont}
            scale={scale}
          />
          {renderSkills(data.skills)}
        </View>
      );
    }

    if (section.type === "projects") {
      if (safeArray(data.projects).length === 0) return null;
      return (
        <View key={section.id} style={{ marginBottom: sectionGap }}>
          <ResumeSectionHeading
            title={title}
            sectionStyle={config.sectionStyle}
            accentColor={accentColor}
            headingFont={headingFont}
            scale={scale}
          />
          {renderProjects(data.projects)}
        </View>
      );
    }

    if (section.type === "certifications") {
      if (safeArray(data.certifications).length === 0) return null;
      return (
        <View key={section.id} style={{ marginBottom: sectionGap }}>
          <ResumeSectionHeading
            title={title}
            sectionStyle={config.sectionStyle}
            accentColor={accentColor}
            headingFont={headingFont}
            scale={scale}
          />
          {renderCertifications(data.certifications)}
        </View>
      );
    }

    return null;
  };

  const sections = structure.map((section) => renderSection(section)).filter(Boolean);

  return (
    <Document author="ResuPro" producer="ResuPro PDF Engine">
      <Page
        size="A4"
        wrap
        style={{
          paddingTop: pagePadding,
          paddingBottom: pagePadding,
          paddingHorizontal: pagePadding,
          backgroundColor: surfaceColor,
          color: textColor,
          fontFamily: bodyFont,
          fontSize: bodyFontSize,
        }}
      >
        {sections}
      </Page>
    </Document>
  );
}

function CoverLetterPdfDocument({ input }: { input: CoverLetterPdfInput }) {
  const override = COVER_LETTER_TEMPLATE_OVERRIDES[input.templateId] ?? {};
  const config = normalizeCoverLetterConfig({
    ...(input.config ?? {}),
    ...override,
  });

  const data = input.data;
  const scale = getFontScale(data.metadata?.fontSize);
  const accentColor = normalizePdfColor(data.metadata?.themeColor || config.accentColor, "#111827");
  const headingFont = pickPdfFont(config.headingFont);
  const bodyFont = pickPdfFont(data.metadata?.fontFamily || config.bodyFont);
  const textColor = "#111827";
  const mutedColor = "#4b5563";

  const pagePadding = scaleValue(34, scale);
  const headingSize = scaleValue(27, scale);
  const bodyFontSize = scaleValue(10.8, scale);
  const smallFontSize = scaleValue(9.5, scale);
  const lineHeight = scaleValue(1.48, scale);

  const separator =
    config.sectionSeparator === "none" ? null : (
      <View
        style={{
          marginVertical: scaleValue(10, scale),
          height: config.sectionSeparator === "bar" ? scaleValue(3, scale) : scaleValue(1, scale),
          width: "100%",
          backgroundColor: accentColor,
        }}
      />
    );

  return (
    <Document author="ResuPro" producer="ResuPro PDF Engine">
      <Page
        size="A4"
        wrap
        style={{
          paddingTop: pagePadding,
          paddingBottom: pagePadding,
          paddingHorizontal: pagePadding,
          backgroundColor: "#ffffff",
          color: textColor,
          fontFamily: bodyFont,
          fontSize: bodyFontSize,
        }}
      >
        <View
          style={{
            marginBottom: scaleValue(14, scale),
            alignItems: config.headerStyle === "center" ? "center" : "flex-start",
          }}
        >
          <Text
            style={{
              color: accentColor,
              fontFamily: headingFont,
              fontSize: headingSize,
            }}
          >
            {textOrFallback(data.personalInfo.fullName, "Your Name")}
          </Text>
          <Text
            style={{
              color: mutedColor,
              fontFamily: bodyFont,
              fontSize: smallFontSize,
              marginTop: scaleValue(4, scale),
              textAlign: config.headerStyle === "center" ? "center" : "left",
            }}
          >
            {[
              textOrFallback(data.personalInfo.email),
              textOrFallback(data.personalInfo.phone),
              [
                textOrFallback(data.personalInfo.address),
                textOrFallback(data.personalInfo.city),
                textOrFallback(data.personalInfo.zipCode),
              ]
                .filter(Boolean)
                .join(", "),
            ]
              .filter(Boolean)
              .join(" | ")}
          </Text>
        </View>

        {separator}

        <View style={{ marginBottom: scaleValue(12, scale), gap: scaleValue(2, scale) }}>
          <Text style={{ color: textColor, fontFamily: headingFont, fontSize: scaleValue(11, scale) }}>
            {textOrFallback(data.recipientInfo.managerName)}
          </Text>
          <Text style={{ color: textColor, fontFamily: bodyFont, fontSize: bodyFontSize }}>
            {textOrFallback(data.recipientInfo.companyName)}
          </Text>
          <Text style={{ color: mutedColor, fontFamily: bodyFont, fontSize: smallFontSize }}>
            {[
              textOrFallback(data.recipientInfo.address),
              textOrFallback(data.recipientInfo.city),
              textOrFallback(data.recipientInfo.zipCode),
            ]
              .filter(Boolean)
              .join(", ")}
          </Text>
          {data.recipientInfo.email ? (
            <Text style={{ color: mutedColor, fontFamily: bodyFont, fontSize: smallFontSize }}>
              {textOrFallback(data.recipientInfo.email)}
            </Text>
          ) : null}
        </View>

        {separator}

        {data.content.subject ? (
          <Text
            style={{
              color: accentColor,
              fontFamily: headingFont,
              fontSize: scaleValue(11, scale),
              marginBottom: scaleValue(10, scale),
            }}
          >
            Subject: {stripInlineFormatting(data.content.subject)}
          </Text>
        ) : null}

        <View style={{ gap: scaleValue(8, scale) }}>
          <Text style={{ color: textColor, fontFamily: bodyFont, fontSize: bodyFontSize }}>
            {stripInlineFormatting(textOrFallback(data.content.greeting, "Dear Hiring Manager,"))}
          </Text>
          <RichBlocks
            value={textOrFallback(data.content.opening)}
            textColor={textColor}
            fontSize={bodyFontSize}
            lineHeight={lineHeight}
            fontFamily={bodyFont}
            scale={scale}
          />
          <RichBlocks
            value={textOrFallback(data.content.body)}
            textColor={textColor}
            fontSize={bodyFontSize}
            lineHeight={lineHeight}
            fontFamily={bodyFont}
            scale={scale}
          />
          <RichBlocks
            value={textOrFallback(data.content.closing)}
            textColor={textColor}
            fontSize={bodyFontSize}
            lineHeight={lineHeight}
            fontFamily={bodyFont}
            scale={scale}
          />
        </View>

        <View style={{ marginTop: scaleValue(16, scale) }}>
          <Text style={{ color: textColor, fontFamily: bodyFont, fontSize: bodyFontSize }}>
            {stripInlineFormatting(textOrFallback(data.content.signature))}
          </Text>
          <Text
            style={{
              color: accentColor,
              fontFamily: headingFont,
              fontSize: scaleValue(12, scale),
              marginTop: scaleValue(3, scale),
            }}
          >
            {textOrFallback(data.personalInfo.fullName)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderPdfBuffer(input: PdfRenderInput): Promise<Buffer> {
  if (input.type === "cover_letter") {
    return (await renderToBuffer(<CoverLetterPdfDocument input={input} />)) as Buffer;
  }

  return (await renderToBuffer(<ResumePdfDocument input={input} />)) as Buffer;
}
