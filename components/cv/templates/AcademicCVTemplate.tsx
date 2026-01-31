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
  
  const themeColor = data.metadata?.themeColor || '#0f172a'; // Default slate-900
  const fontName = data.metadata?.fontFamily || 'Times New Roman'; // Default serif
  const fontSize = data.metadata?.fontSize || 'md';
  const scaleMap: Record<string, number> = { sm: 0.875, md: 1, lg: 1.125 };
  const scale = scaleMap[fontSize] || 1;

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
            <h2 
                className="text-lg font-bold uppercase tracking-wider border-b-2 pb-1 mb-4 font-serif"
                style={{ color: themeColor, borderColor: themeColor }}
            >
              Professional Experience
            </h2>
            <div className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline font-serif">
                    <h3 className="text-md font-bold" style={{ color: themeColor }}>{exp.role}</h3>
                    <span className="text-sm italic text-gray-700">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                  <div className="text-md text-gray-800 italic mb-2 font-serif">{exp.company}, {exp.location}</div>
                  <ul className="list-disc list-outside ml-5 space-y-1">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="text-sm text-gray-800 leading-relaxed font-serif pl-1">
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
            <h2 
                className="text-lg font-bold uppercase tracking-wider border-b-2 pb-1 mb-4 font-serif"
                style={{ color: themeColor, borderColor: themeColor }}
            >
              Research & Projects
            </h2>
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-md font-bold font-serif" style={{ color: themeColor }}>
                      {project.name}
                      {project.link && (
                        <a href={project.link} className="ml-2 text-sm font-normal text-blue-800 hover:underline italic">
                          [Link]
                        </a>
                      )}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-800 mb-1 font-serif text-justify">{project.description}</p>
                  {project.technologies.length > 0 && (
                    <p className="text-xs text-gray-600 font-serif italic">
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
            <h2 
                className="text-lg font-bold uppercase tracking-wider border-b-2 pb-1 mb-4 font-serif"
                style={{ color: themeColor, borderColor: themeColor }}
            >
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="grid grid-cols-[1fr_auto] gap-4">
                  <div>
                    <h3 className="text-md font-bold font-serif" style={{ color: themeColor }}>{edu.institution}</h3>
                    <p className="text-sm text-gray-800 font-serif">
                      {edu.degree} in {edu.field}
                    </p>
                    {edu.gpa && <p className="text-sm text-gray-600 italic font-serif">GPA: {edu.gpa}</p>}
                  </div>
                  <div className="text-right text-sm text-gray-700 font-serif italic">
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
            <h2 
                className="text-lg font-bold uppercase tracking-wider border-b-2 pb-1 mb-4 font-serif"
                style={{ color: themeColor, borderColor: themeColor }}
            >
              Skills
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {skills.map((group) => (
                <div key={group.id} className="flex gap-2 text-sm font-serif">
                  <span className="font-bold min-w-[120px]" style={{ color: themeColor }}>{group.name}:</span>
                  <span className="text-gray-800">{group.skills.join(", ")}</span>
                </div>
              ))}
            </div>
          </section>
        );
      case 'certifications':
        if (certifications.length === 0) return null;
        return (
          <section key={section.id} className="mb-6">
            <h2 
                className="text-lg font-bold uppercase tracking-wider border-b-2 pb-1 mb-4 font-serif"
                style={{ color: themeColor, borderColor: themeColor }}
            >
              Certifications
            </h2>
            <ul className="space-y-2">
              {certifications.map((cert) => (
                <li key={cert.id} className="text-sm font-serif flex justify-between">
                  <span className="font-semibold" style={{ color: themeColor }}>{cert.name}</span>
                  <span className="italic text-gray-700">
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
                 <h2 
                    className="text-lg font-bold uppercase tracking-wider border-b-2 pb-1 mb-4 font-serif"
                    style={{ color: themeColor, borderColor: themeColor }}
                 >
                     Professional Summary
                 </h2>
                 <p className="text-sm text-gray-800 leading-relaxed font-serif text-justify">
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
      className={`resume-template bg-[#fdfbf7] text-gray-900 p-16 min-h-[11in] ${className}`}
      style={{ 
        fontFamily: `"${fontName}", serif`,
        zoom: scale
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;700&display=swap');
      `}</style>

      <header className="text-center mb-8 border-b-4 border-double pb-6" style={{ borderColor: themeColor }}>
        <h1 className="text-4xl font-bold mb-3 tracking-tight font-serif uppercase" style={{ color: themeColor }}>
          {basics.name || "Your Name"}
        </h1>
        <div className="text-lg text-gray-700 italic font-serif mb-3">
          {basics.title || "Professional Title"}
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-gray-800 font-serif">
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