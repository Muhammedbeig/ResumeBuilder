import type { ResumeData, SectionConfig } from "@/types";
import { useMemo } from "react";

interface AcademicCVTemplateProps {
  data: ResumeData;
  className?: string;
}

const DEFAULT_STRUCTURE: SectionConfig[] = [
  { id: 'education', type: 'education', title: 'Education', isVisible: true, order: 0 },
  { id: 'experience', type: 'experience', title: 'Academic Experience', isVisible: true, order: 1 },
  { id: 'projects', type: 'projects', title: 'Research Projects', isVisible: true, order: 2 },
  { id: 'skills', type: 'skills', title: 'Technical Skills', isVisible: true, order: 3 },
  { id: 'certifications', type: 'certifications', title: 'Certifications & Awards', isVisible: true, order: 4 },
];

export function AcademicCVTemplate({ data, className = "" }: AcademicCVTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications } = data;
  const contactItems = [
    basics.email,
    basics.phone,
    basics.location,
    basics.linkedin,
    basics.github,
  ].filter(Boolean);

  const activeStructure = useMemo(() => {
    if (data.structure && data.structure.length > 0) {
      return [...data.structure].sort((a, b) => a.order - b.order);
    }
    return DEFAULT_STRUCTURE;
  }, [data.structure]);

  const renderSection = (section: SectionConfig) => {
    switch (section.type) {
      case 'experience':
        if (experiences.length === 0) return null;
        return (
          <section key={section.id} className="mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-800 pb-1 mb-4 font-serif">
              Professional Experience
            </h2>
            <div className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline font-serif">
                    <h3 className="text-md font-bold text-slate-900">{exp.role}</h3>
                    <span className="text-sm text-slate-700 italic">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                  <div className="text-md text-slate-800 italic mb-2 font-serif">{exp.company}, {exp.location}</div>
                  <ul className="list-disc list-outside ml-5 space-y-1">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="text-sm text-slate-800 leading-relaxed font-serif pl-1">
                        {bullet}
                      </li>
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
          <section key={section.id} className="mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-800 pb-1 mb-4 font-serif">
              Research & Projects
            </h2>
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-md font-bold text-slate-900 font-serif">
                      {project.name}
                      {project.link && (
                        <a href={project.link} className="ml-2 text-sm font-normal text-blue-800 hover:underline italic">
                          [Link]
                        </a>
                      )}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-800 mb-1 font-serif text-justify">{project.description}</p>
                  {project.technologies.length > 0 && (
                    <p className="text-xs text-slate-600 font-serif italic">
                      <span className="font-semibold">Tools:</span> {project.technologies.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      case 'education':
        if (education.length === 0) return null;
        return (
          <section key={section.id} className="mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-800 pb-1 mb-4 font-serif">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="grid grid-cols-[1fr_auto] gap-4">
                  <div>
                    <h3 className="text-md font-bold text-slate-900 font-serif">{edu.institution}</h3>
                    <p className="text-sm text-slate-800 font-serif">
                      {edu.degree} in {edu.field}
                    </p>
                    {edu.gpa && <p className="text-sm text-slate-600 italic font-serif">GPA: {edu.gpa}</p>}
                  </div>
                  <div className="text-right text-sm text-slate-700 font-serif italic">
                    {edu.startDate} – {edu.endDate}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 'skills':
        if (skills.length === 0) return null;
        return (
          <section key={section.id} className="mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-800 pb-1 mb-4 font-serif">
              Skills
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {skills.map((group) => (
                <div key={group.id} className="flex gap-2 text-sm font-serif">
                  <span className="font-bold text-slate-900 min-w-[120px]">{group.name}:</span>
                  <span className="text-slate-800">{group.skills.join(", ")}</span>
                </div>
              ))}
            </div>
          </section>
        );
      case 'certifications':
        if (certifications.length === 0) return null;
        return (
          <section key={section.id} className="mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-800 pb-1 mb-4 font-serif">
              Certifications
            </h2>
            <ul className="space-y-2">
              {certifications.map((cert) => (
                <li key={cert.id} className="text-sm font-serif flex justify-between">
                  <span className="font-semibold text-slate-900">{cert.name}</span>
                  <span className="italic text-slate-700">
                    {cert.issuer} {cert.date && `— ${cert.date}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      case 'summary':
         if (!basics.summary) return null;
         return (
             <section key={section.id} className="mb-6">
                 <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-800 pb-1 mb-4 font-serif">
                     Professional Summary
                 </h2>
                 <p className="text-sm text-slate-800 leading-relaxed font-serif text-justify">
                    {basics.summary}
                 </p>
             </section>
         );
      default:
        return null;
    }
  };

  return (
    <div
      id="cv-academic"
      className={`resume-template bg-[#fdfbf7] text-slate-900 p-16 min-h-[11in] ${className}`}
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      <header className="text-center mb-8 border-b-4 border-double border-slate-900 pb-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight font-serif uppercase">
          {basics.name || "Your Name"}
        </h1>
        <div className="text-lg text-slate-700 italic font-serif mb-3">
          {basics.title || "Professional Title"}
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-slate-800 font-serif">
          {contactItems.map((item, index) => (
            <span key={index} className="flex items-center">
              {item}
            </span>
          ))}
        </div>
      </header>

      <main>
        {activeStructure.map((section) => {
          if (!section.isVisible || section.type === 'basics') return null;
          return renderSection(section);
        })}
      </main>
    </div>
  );
}
