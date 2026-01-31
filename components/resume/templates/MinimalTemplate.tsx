import type { ResumeData, SectionConfig } from '@/types';
import { useMemo } from 'react';

interface MinimalTemplateProps {
  data: ResumeData;
  className?: string;
}

const DEFAULT_STRUCTURE: SectionConfig[] = [
  { id: 'summary', type: 'summary', title: 'Summary', isVisible: true, order: 0 },
  { id: 'experience', type: 'experience', title: 'Experience', isVisible: true, order: 1 },
  { id: 'education', type: 'education', title: 'Education', isVisible: true, order: 2 },
  { id: 'skills', type: 'skills', title: 'Skills', isVisible: true, order: 3 },
  { id: 'projects', type: 'projects', title: 'Projects', isVisible: true, order: 4 },
  { id: 'certifications', type: 'certifications', title: 'Certifications', isVisible: true, order: 5 },
];

export function MinimalTemplate({ data, className = '' }: MinimalTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications } = data;
  const themeColor = data.metadata?.themeColor || '#000000';
  const fontName = data.metadata?.fontFamily || 'Inter';
  const fontSize = data.metadata?.fontSize || 'md';
  
  const scaleMap: Record<string, number> = { sm: 0.875, md: 1, lg: 1.125 };
  const scale = scaleMap[fontSize] || 1;

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
          <div key={section.id} className="mb-10">
            <p className="text-gray-600 leading-relaxed text-lg font-light tracking-wide">{basics.summary}</p>
          </div>
        );
      case 'experience':
        if (experiences.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-6" style={{ color: themeColor }}>Work History</h2>
            <div className="space-y-8">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">{exp.role}</h3>
                    <span className="text-xs font-mono text-gray-400">
                      {exp.startDate} / {exp.current ? 'PRESENT' : exp.endDate}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-500 mb-3">{exp.company} — {exp.location}</p>
                  <ul className="space-y-2">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="text-sm text-gray-600 leading-relaxed pl-4 border-l border-gray-200">{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      case 'education':
        if (education.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-6" style={{ color: themeColor }}>Education</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {education.map((edu) => (
                <div key={edu.id}>
                  <p className="font-bold text-gray-900">{edu.institution}</p>
                  <p className="text-sm text-gray-500">{edu.degree}</p>
                  <p className="text-xs text-gray-400 mt-1">{edu.startDate} – {edu.endDate}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'skills':
        if (skills.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-6" style={{ color: themeColor }}>Capabilities</h2>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {skills.map((group) => (
                <div key={group.id}>
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">{group.name}</p>
                  <p className="text-sm text-gray-700">{group.skills.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'projects':
        if (projects.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-6" style={{ color: themeColor }}>Projects</h2>
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id}>
                   <h3 className="text-lg font-bold text-gray-900 tracking-tight">{project.name}</h3>
                   <p className="text-sm text-gray-600">{project.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'certifications':
        if (certifications.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-6" style={{ color: themeColor }}>Certifications</h2>
             <div className="space-y-2">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="text-sm font-bold text-gray-900">{cert.name}</p>
                  <p className="text-xs text-gray-600">{cert.issuer}</p>
                </div>
              ))}
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id="resume-minimal"
      className={`resume-template bg-white text-gray-900 p-16 sm:p-24 ${className}`}
      style={{ 
        fontFamily: `"${fontName}", sans-serif`,
        zoom: scale
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;700;900&display=swap');
      `}</style>

      {/* Minimal Header */}
      <header className="mb-16">
        <h1 className="text-6xl font-black tracking-tighter mb-4" style={{ color: themeColor }}>
            {basics.name?.split(' ').map((n, i) => (
                <span key={i} className={i === 0 ? "block" : "block opacity-20"}>{n}</span>
            ))}
        </h1>
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 mt-8 border-t border-gray-100 pt-8">
            <p className="text-xl font-medium text-gray-400 uppercase tracking-widest">{basics.title}</p>
            <div className="flex gap-4 text-xs font-mono text-gray-400">
                {basics.email && <span>{basics.email}</span>}
                {basics.location && <span>{basics.location}</span>}
            </div>
        </div>
      </header>

      {activeStructure.map((section) => {
        if (!section.isVisible || section.type === 'basics') return null;
        return renderSection(section);
      })}
    </div>
  );
}