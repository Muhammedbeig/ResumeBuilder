import type { ResumeData, SectionConfig } from "@/types";
import { useMemo } from "react";
import { getFontScale } from "@/lib/typography";
import { RichText } from "@/components/editor/RichText";
import type { ResumeTemplateCatalogEntry } from "@/lib/resume-template-catalog";

interface CatalogTemplateProps {
  data: ResumeData;
  config: ResumeTemplateCatalogEntry;
  className?: string;
}

const DEFAULT_STRUCTURE: SectionConfig[] = [
  { id: "basics", type: "basics", title: "Personal Info", isVisible: true, order: 0 },
  { id: "summary", type: "summary", title: "Professional Summary", isVisible: true, order: 1 },
  { id: "experience", type: "experience", title: "Experience", isVisible: true, order: 2 },
  { id: "education", type: "education", title: "Education", isVisible: true, order: 3 },
  { id: "skills", type: "skills", title: "Skills", isVisible: true, order: 4 },
  { id: "projects", type: "projects", title: "Projects", isVisible: true, order: 5 },
  { id: "certifications", type: "certifications", title: "Certifications", isVisible: true, order: 6 },
];

const hexToRgba = (hex: string, alpha: number) => {
  const cleaned = hex.replace("#", "").trim();
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((char) => char + char)
          .join("")
      : cleaned;
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return `rgba(0, 0, 0, ${alpha})`;
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "YN";

export function CatalogTemplate({ data, config, className = "" }: CatalogTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications, structure } = data;
  const themeColor = data.metadata?.themeColor || "#6366f1";
  const bodyFont = data.metadata?.fontFamily || config.bodyFont;
  const headingFont = config.headingFont;
  const fontSize = data.metadata?.fontSize;
  const scale = getFontScale(fontSize);
  const accentSoft = hexToRgba(themeColor, 0.14);
  const accentSoftStrong = hexToRgba(themeColor, 0.22);
  const isSidebarLayout = config.layout === "sidebar-left" || config.layout === "sidebar-right";

  const activeStructure = useMemo(() => {
    if (structure && structure.length > 0) {
      return [...structure].sort((a, b) => a.order - b.order);
    }
    return DEFAULT_STRUCTURE;
  }, [structure]);

  const contactItems = [
    basics.location,
    basics.email,
    basics.phone,
    basics.linkedin,
    basics.github,
    basics.portfolio,
  ].filter(Boolean);

  const renderSectionTitle = (title: string) => {
    switch (config.sectionStyle) {
      case "underline":
        return (
          <div className="mb-3">
            <h2
              className="text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: themeColor, fontFamily: `"${headingFont}", serif` }}
            >
              {title}
            </h2>
            <div className="mt-2 h-[2px] w-10" style={{ backgroundColor: themeColor }} />
          </div>
        );
      case "pill":
        return (
          <div className="mb-3">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest"
              style={{
                backgroundColor: accentSoft,
                color: themeColor,
                fontFamily: `"${headingFont}", serif`,
              }}
            >
              {title}
            </span>
          </div>
        );
      case "stripe":
        return (
          <div className="mb-3 flex items-center gap-3">
            <span className="h-6 w-1 rounded-full" style={{ backgroundColor: themeColor }} />
            <h2
              className="text-sm font-semibold uppercase tracking-[0.22em]"
              style={{ color: themeColor, fontFamily: `"${headingFont}", serif` }}
            >
              {title}
            </h2>
          </div>
        );
      case "caps":
      default:
        return (
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-[0.3em]"
            style={{ color: themeColor, fontFamily: `"${headingFont}", serif` }}
          >
            {title}
          </h2>
        );
    }
  };

  const renderBulletMarker = () => {
    switch (config.bulletStyle) {
      case "dash":
        return <span className="absolute left-0 top-2 h-[2px] w-3" style={{ backgroundColor: themeColor }} />;
      case "diamond":
        return (
          <span
            className="absolute left-0 top-[6px] h-2 w-2 rotate-45"
            style={{ backgroundColor: themeColor }}
          />
        );
      case "line":
        return <span className="absolute left-0 top-1 h-4 w-1 rounded-full" style={{ backgroundColor: themeColor }} />;
      case "dot":
      default:
        return <span className="absolute left-0 top-2 h-2 w-2 rounded-full" style={{ backgroundColor: themeColor }} />;
    }
  };

  const renderBasicsHeader = () => {
    const photo = (
      <div className="relative">
        {basics.image ? (
          <img
            src={basics.image}
            alt={basics.name || "Profile"}
            className="h-20 w-20 rounded-full object-cover border-4"
            style={{ borderColor: accentSoftStrong }}
          />
        ) : (
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center text-lg font-semibold uppercase"
            style={{ backgroundColor: accentSoftStrong, color: themeColor }}
          >
            {getInitials(basics.name || "Your Name")}
          </div>
        )}
      </div>
    );

    if (config.headerStyle === "center") {
      return (
        <div className="text-center mb-6">
          {config.hasPhoto && <div className="flex justify-center mb-4">{photo}</div>}
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: `"${headingFont}", serif` }}
          >
            {basics.name || "Your Name"}
          </h1>
          <p className="text-base mt-1" style={{ color: config.palette.muted }}>
            {basics.title || "Professional Title"}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs" style={{ color: config.palette.muted }}>
            {contactItems.map((item) => (
              <span key={item} className="px-2 py-1 rounded-full" style={{ backgroundColor: accentSoft }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (config.headerStyle === "split") {
      return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            {config.hasPhoto && photo}
            <div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: `"${headingFont}", serif` }}
              >
                {basics.name || "Your Name"}
              </h1>
              <p className="text-base mt-1" style={{ color: config.palette.muted }}>
                {basics.title || "Professional Title"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs" style={{ color: config.palette.muted }}>
            {contactItems.map((item) => (
              <span key={item} className="px-3 py-1 rounded-full" style={{ backgroundColor: accentSoft }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <div className={`flex gap-4 ${isSidebarLayout ? "flex-col items-start" : "items-center"}`}>
          {config.hasPhoto && photo}
          <div className={isSidebarLayout ? "w-full" : "min-w-0 flex-1"}>
            <h1
              className={`font-bold tracking-tight break-words ${
                isSidebarLayout ? "text-2xl" : "text-3xl"
              }`}
              style={{ fontFamily: `"${headingFont}", serif` }}
            >
              {basics.name || "Your Name"}
            </h1>
            <p
              className={`mt-1 break-words ${isSidebarLayout ? "text-sm" : "text-base"}`}
              style={{ color: config.palette.muted }}
            >
              {basics.title || "Professional Title"}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs" style={{ color: config.palette.muted }}>
          {contactItems.map((item) => (
            <span
              key={item}
              className="max-w-full break-all px-3 py-1 rounded-full"
              style={{ backgroundColor: accentSoft }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderSummary = (id: string) => {
    if (!basics.summary) return null;
    return (
      <div key={id} className="mb-5">
        {renderSectionTitle("Summary")}
        <RichText text={basics.summary} className="text-sm leading-relaxed" />
      </div>
    );
  };

  const renderExperience = (id: string) => {
    if (experiences.length === 0) return null;
    return (
      <div key={id} className="mb-5">
        {renderSectionTitle("Experience")}
        <div className="space-y-4">
          {experiences.map((exp, idx) => (
            <div key={exp.id || idx}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold" style={{ fontFamily: `"${headingFont}", serif` }}>
                    {exp.role}
                  </h3>
                  <p className="text-xs" style={{ color: config.palette.muted }}>
                    {exp.company} - {exp.location}
                  </p>
                </div>
                <span className="text-xs" style={{ color: config.palette.muted }}>
                  {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {exp.bullets.map((bullet, bIdx) => (
                  <li key={bIdx} className="relative pl-5 text-sm leading-relaxed">
                    {renderBulletMarker()}
                    <RichText inline text={bullet} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEducation = (id: string) => {
    if (education.length === 0) return null;
    return (
      <div key={id} className="mb-5">
        {renderSectionTitle("Education")}
        <div className="space-y-3">
          {education.map((edu, idx) => (
            <div key={edu.id || idx}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold" style={{ fontFamily: `"${headingFont}", serif` }}>
                    {edu.institution}
                  </h3>
                  <p className="text-xs" style={{ color: config.palette.muted }}>
                    {edu.degree} in {edu.field}
                  </p>
                </div>
                <span className="text-xs" style={{ color: config.palette.muted }}>
                  {edu.startDate} - {edu.endDate}
                </span>
              </div>
              {edu.gpa && (
                <p className="text-xs mt-1" style={{ color: config.palette.muted }}>
                  GPA: {edu.gpa}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSkills = (id: string) => {
    if (skills.length === 0) return null;
    return (
      <div key={id} className="mb-5">
        {renderSectionTitle("Skills")}
        <div className="space-y-3">
          {skills.map((group, idx) => (
            <div key={group.id || idx}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: themeColor }}>
                {group.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: accentSoft, color: config.palette.text }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProjects = (id: string) => {
    if (projects.length === 0) return null;
    return (
      <div key={id} className="mb-5">
        {renderSectionTitle("Projects")}
        <div className="space-y-4">
          {projects.map((project, idx) => (
            <div key={project.id || idx}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-semibold" style={{ fontFamily: `"${headingFont}", serif` }}>
                  {project.name}
                </h3>
                {project.link && (
                  <a
                    href={project.link}
                    className="text-xs font-semibold"
                    style={{ color: themeColor }}
                  >
                    View Project
                  </a>
                )}
              </div>
              <RichText text={project.description} className="text-sm leading-relaxed mt-1" />
              {project.technologies.length > 0 && (
                <p className="text-xs mt-2" style={{ color: config.palette.muted }}>
                  <span className="font-semibold">Tech:</span> {project.technologies.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCertifications = (id: string) => {
    if (certifications.length === 0) return null;
    return (
      <div key={id} className="mb-5">
        {renderSectionTitle("Certifications")}
        <div className="space-y-2">
          {certifications.map((cert, idx) => (
            <div key={cert.id || idx}>
              <p className="text-sm font-semibold" style={{ fontFamily: `"${headingFont}", serif` }}>
                {cert.name}
              </p>
              <p className="text-xs" style={{ color: config.palette.muted }}>
                {cert.issuer} - {cert.date}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSection = (section: SectionConfig) => {
    if (section.isVisible === false) return null;
    switch (section.type) {
      case "summary":
        return renderSummary(section.id);
      case "experience":
        return renderExperience(section.id);
      case "education":
        return renderEducation(section.id);
      case "skills":
        return renderSkills(section.id);
      case "projects":
        return renderProjects(section.id);
      case "certifications":
        return renderCertifications(section.id);
      default:
        return null;
    }
  };

  const renderSectionGroup = (types: Array<SectionConfig["type"]>) =>
    activeStructure
      .filter((section) => types.includes(section.type) && section.isVisible !== false)
      .map((section) => renderSection(section))
      .filter(Boolean);

  const containerClass =
    config.layout === "cards" ? "grid gap-6 md:grid-cols-2" : "space-y-4";
  const sectionCardClass =
    config.layout === "cards"
      ? "rounded-2xl border px-4 py-4 backdrop-blur-sm"
      : "";

  return (
    <div
      className={`resume-template relative min-h-[1188px] overflow-hidden ${className}`}
      style={{
        ...config.background,
        color: config.palette.text,
        fontFamily: `"${bodyFont}", sans-serif`,
        zoom: scale,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${bodyFont.replace(/ /g, "+")}:wght@300;400;500;600;700&family=${headingFont.replace(/ /g, "+")}:wght@400;600;700&display=swap');
      `}</style>
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        {config.ornament === "orbs" && (
          <>
            <div
              className="absolute -top-16 -right-12 h-40 w-40 rounded-full blur-2xl"
              style={{ backgroundColor: accentSoftStrong }}
            />
            <div
              className="absolute bottom-0 left-8 h-32 w-32 rounded-full blur-2xl"
              style={{ backgroundColor: accentSoft }}
            />
          </>
        )}
        {config.ornament === "grid" && (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:28px_28px]" />
        )}
        {config.ornament === "stripes" && (
          <div className="absolute -top-10 -left-10 h-40 w-[140%] rotate-2 opacity-30" style={{ backgroundColor: accentSoft }} />
        )}
        {config.ornament === "corner" && (
          <div className="absolute top-6 right-6 h-20 w-20 border-2 rounded-xl" style={{ borderColor: accentSoftStrong }} />
        )}
        {config.ornament === "badge" && (
          <div
            className="absolute top-6 left-6 h-12 w-12 rounded-full flex items-center justify-center text-xs font-semibold uppercase"
            style={{ backgroundColor: accentSoftStrong, color: themeColor }}
          >
            {getInitials(basics.name || "Resume")}
          </div>
        )}
      </div>

      <div className="relative z-10 p-10">
        {config.layout === "sidebar-left" || config.layout === "sidebar-right" ? (
          <div
            className={`grid gap-8 ${
              config.layout === "sidebar-left"
                ? "grid-cols-[240px_1fr]"
                : "grid-cols-[1fr_240px]"
            }`}
          >
            <div
              className="rounded-3xl border p-5 backdrop-blur-sm"
              style={{
                backgroundColor: config.palette.surface,
                borderColor: config.palette.border,
              }}
            >
              {renderBasicsHeader()}
              {renderSkills("skills")}
              {renderCertifications("certifications")}
            </div>
            <div>
              {renderSummary("summary")}
              {renderExperience("experience")}
              {renderEducation("education")}
              {renderProjects("projects")}
            </div>
          </div>
        ) : (
          <>
            {renderBasicsHeader()}
            {config.layout === "split" ? (
              <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
                <div>{renderSectionGroup(["summary", "experience", "projects"])}</div>
                <div>{renderSectionGroup(["skills", "education", "certifications"])}</div>
              </div>
            ) : (
              <div className={containerClass}>
                {activeStructure.map((section) => {
                  if (section.type === "basics") return null;
                  const content = renderSection(section);
                  if (!content) return null;
                  return (
                    <div
                      key={section.id}
                      className={sectionCardClass}
                      style={{
                        backgroundColor: config.palette.surface,
                        borderColor: config.palette.border,
                      }}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
