import type { ResumeData, SectionConfig } from '@/types';
import { useMemo } from 'react';
import { getFontScale } from '@/lib/typography';
import { RichText } from '@/components/editor/RichText';

interface ProfessionalTemplateProps {
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

export function ProfessionalTemplate({ data, className = '' }: ProfessionalTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications } = data;
  const themeColor = data.metadata?.themeColor || '#0f172a'; // Default slate-900
  const fontName = data.metadata?.fontFamily || 'Merriweather';
  const fontSize = data.metadata?.fontSize;
  const scale = getFontScale(fontSize);

  const activeStructure = useMemo(() => {
    if (data.structure && data.structure.length > 0) {
      return [...data.structure].sort((a, b) => a.order - b.order);
    }
    return DEFAULT_STRUCTURE;
  }, [data.structure]);

  const renderSection = (section: SectionConfig) => {
    switch (section.type) {
      case 'summary':
        if (!basics.summary) return null;
        return (
          <div key={section.id} className="mb-8 max-w-3xl mx-auto text-center">
            <RichText text={basics.summary} className="text-slate-700 leading-relaxed italic text-lg" />
          </div>
        );
      case 'skills':
        if (skills.length === 0) return null;
        return (
          <div key={section.id} className="mb-8 py-4 bg-slate-50 border-y border-slate-200">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {skills.map((group) => (
                <div key={group.id} className="flex flex-col items-center">
                  <span className="font-bold mb-1 uppercase text-xs tracking-wider" style={{ color: themeColor }}>{group.name}</span>
                  <span className="text-slate-600 text-center">{group.skills.join(' • ')}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'experience':
        if (experiences.length === 0) return null;
        return (
          <section key={section.id} className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
              <span className="flex-1 h-px" style={{ backgroundColor: `${themeColor}33` }}></span>
              <span className="uppercase tracking-widest" style={{ color: themeColor }}>Experience</span>
              <span className="flex-1 h-px" style={{ backgroundColor: `${themeColor}33` }}></span>
            </h2>
            <div className="space-y-8">
              {experiences.map((exp) => (
                <div key={exp.id} className="relative pl-6 border-l-2 border-slate-200">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full" style={{ backgroundColor: themeColor }}></div>
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-xl font-bold" style={{ color: themeColor }}>{exp.role}</h3>
                    <span className="text-slate-500 font-medium whitespace-nowrap">
                      {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg text-slate-700 font-semibold">{exp.company}</span>
                    <span className="text-slate-500 text-sm">{exp.location}</span>
                  </div>
                  <ul className="space-y-2">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="text-slate-600 leading-relaxed flex items-start gap-2">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: `${themeColor}88` }} />
                        <RichText inline text={bullet} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      case 'education':
        if (education.length === 0) return null;
        return (
          <section key={section.id} className="mb-8">
            <h2 className="text-lg font-bold mb-4 uppercase tracking-widest border-b pb-2" style={{ color: themeColor, borderColor: `${themeColor}33` }}>
              Education
            </h2>
            <div className="space-y-6">
              {education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="font-bold text-slate-900">{edu.institution}</h3>
                  <div className="flex justify-between text-slate-700">
                    <span>{edu.degree} in {edu.field}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500 mt-1">
                    <span>{edu.startDate} – {edu.endDate}</span>
                    {edu.gpa && <span>GPA: {edu.gpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 'projects':
        if (projects.length === 0) return null;
        return (
          <section key={section.id} className="mb-8">
            <h2 className="text-lg font-bold mb-4 uppercase tracking-widest border-b pb-2" style={{ color: themeColor, borderColor: `${themeColor}33` }}>
              Projects
            </h2>
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-900">{project.name}</h3>
                    {project.link && (
                      <a href={project.link} className="text-xs hover:underline" style={{ color: themeColor }}>Link</a>
                    )}
                  </div>
                  <RichText text={project.description} className="text-sm text-slate-600 mt-1 line-clamp-2" />
                  {project.technologies.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      {project.technologies.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      case 'certifications':
        if (certifications.length === 0) return null;
        return (
          <section key={section.id} className="mb-8">
            <h2 className="text-lg font-bold mb-4 uppercase tracking-widest border-b pb-2" style={{ color: themeColor, borderColor: `${themeColor}33` }}>
              Certifications
            </h2>
            <div className="space-y-3">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="font-semibold text-slate-900 text-sm">{cert.name}</p>
                  <p className="text-xs text-slate-500">{cert.issuer} • {cert.date}</p>
                </div>
              ))}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id="resume-professional"
      className={`resume-template bg-white text-slate-800 p-12 ${className}`}
      style={{ 
        fontFamily: `"${fontName}", serif`,
        zoom: scale
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;700&display=swap');
      `}</style>
      {/* Header - Always Fixed at Top */}
      <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: themeColor }}>
        <h1 className="text-4xl font-bold mb-2 tracking-tight uppercase" style={{ color: themeColor }}>{basics.name || 'Your Name'}</h1>
        <p className="text-xl text-slate-600 mb-4 font-light tracking-wider">{basics.title || 'Professional Title'}</p>
        
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600 font-sans">
          {basics.email && (
            <span className="flex items-center gap-1">
              {basics.email}
            </span>
          )}
          {basics.phone && (
            <span className="flex items-center gap-1">
              {basics.phone}
            </span>
          )}
          {basics.location && (
            <span className="flex items-center gap-1">
              {basics.location}
            </span>
          )}
          {basics.linkedin && (
            <span className="flex items-center gap-1">
              {basics.linkedin.replace(/^https?:\/\//, '')}
            </span>
          )}
          {basics.github && (
            <span className="flex items-center gap-1">
               {basics.github.replace(/^https?:\/\//, '')}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Sections */}
      <div className="grid grid-cols-1 gap-1">
         {activeStructure.map((section) => {
           if (!section.isVisible || section.type === 'basics') return null; // Basics handled above
           return renderSection(section);
         })}
      </div>
    </div>
  );
}
