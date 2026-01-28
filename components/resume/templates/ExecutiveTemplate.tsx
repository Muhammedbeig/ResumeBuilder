import type { ResumeData, SectionConfig } from "@/types";
import { useMemo } from "react";

interface ExecutiveTemplateProps {
  data: ResumeData;
  className?: string;
}

const DEFAULT_STRUCTURE: SectionConfig[] = [
  { id: 'summary', type: 'summary', title: 'Summary', isVisible: true, order: 0 },
  { id: 'skills', type: 'skills', title: 'Skills', isVisible: true, order: 1 },
  { id: 'experience', type: 'experience', title: 'Experience', isVisible: true, order: 2 },
  { id: 'education', type: 'education', title: 'Education', isVisible: true, order: 3 },
  { id: 'projects', type: 'projects', title: 'Projects', isVisible: true, order: 4 },
  { id: 'certifications', type: 'certifications', title: 'Certifications', isVisible: true, order: 5 },
];

export function ExecutiveTemplate({ data, className = "" }: ExecutiveTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications, languages } = data;

  const activeStructure = useMemo(() => {
    if (data.structure && data.structure.length > 0) {
      return [...data.structure].sort((a, b) => a.order - b.order);
    }
    return DEFAULT_STRUCTURE;
  }, [data.structure]);

  const renderSection = (section: SectionConfig) => {
    switch (section.type) {
      case 'skills':
        if (skills.length === 0) return null;
        return (
          <section key={section.id} className="resume-section">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
              Skills
            </h2>
            <div className="space-y-2">
              {skills.map((group) => (
                <div key={group.id}>
                  <p className="text-xs font-semibold text-gray-700">{group.name}</p>
                  <p className="text-xs text-gray-600">{group.skills.join(", ")}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case 'education':
        if (education.length === 0) return null;
        return (
          <section key={section.id} className="resume-section">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
              Education
            </h2>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id}>
                  <p className="text-sm font-semibold text-gray-900">{edu.institution}</p>
                  <p className="text-xs text-gray-600">
                    {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {edu.startDate} - {edu.endDate}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      case 'certifications':
        if (certifications.length === 0) return null;
        return (
          <section key={section.id} className="resume-section">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
              Certifications
            </h2>
            <div className="space-y-2">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="text-sm font-semibold text-gray-900">{cert.name}</p>
                  <p className="text-xs text-gray-600">{cert.issuer}</p>
                  <p className="text-xs text-gray-500">{cert.date}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case 'summary':
        if (!basics.summary) return null;
        return (
          <section key={section.id} className="resume-section">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
              Summary
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{basics.summary}</p>
          </section>
        );
      case 'experience':
        if (experiences.length === 0) return null;
        return (
          <section key={section.id} className="resume-section">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
              Experience
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{exp.role}</p>
                      <p className="text-xs text-gray-600">
                        {exp.company} {exp.location ? `- ${exp.location}` : ""}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                    </p>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-gray-700 list-disc pl-4">
                    {exp.bullets.map((bullet, index) => (
                      <li key={index}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      case 'projects':
        if (projects.length === 0) return null;
        return (
          <section key={section.id} className="resume-section">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
              Projects
            </h2>
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{project.name}</p>
                    {project.link && (
                      <span className="text-xs text-gray-500">{project.link}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{project.description}</p>
                  {project.technologies.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Tech: {project.technologies.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  const sidebarSections = ['skills', 'education', 'certifications'];
  const mainSections = ['summary', 'experience', 'projects'];

  return (
    <div
      id="resume-executive"
      className={`resume-template bg-white text-gray-900 p-12 font-sans ${className}`}
    >
      <header className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {basics.name || "Your Name"}
            </h1>
            <p className="text-sm text-gray-600">
              {basics.title || "Professional Title"}
            </p>
          </div>
          <div className="text-xs text-right text-gray-600 space-y-1">
            {basics.email && <div>{basics.email}</div>}
            {basics.phone && <div>{basics.phone}</div>}
            {basics.location && <div>{basics.location}</div>}
            {basics.linkedin && <div>{basics.linkedin}</div>}
            {basics.github && <div>{basics.github}</div>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6">
        <aside className="col-span-1 space-y-4">
          {activeStructure.map((section) => {
             if (sidebarSections.includes(section.type) && section.isVisible) {
               return renderSection(section);
             }
             return null;
          })}

          {languages.length > 0 && (
            <section className="resume-section">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
                Languages
              </h2>
              <div className="space-y-1 text-xs text-gray-600">
                {languages.map((language) => (
                  <div key={language.id}>
                    {language.name} - {language.proficiency}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        <main className="col-span-2 space-y-5">
           {activeStructure.map((section) => {
             if (mainSections.includes(section.type) && section.isVisible) {
               return renderSection(section);
             }
             return null;
          })}
        </main>
      </div>
    </div>
  );
}
