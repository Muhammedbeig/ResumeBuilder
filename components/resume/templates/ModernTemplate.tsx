import type { ResumeData, SectionConfig } from '@/types';
import { useMemo } from 'react';

interface ModernTemplateProps {
  data: ResumeData;
  className?: string;
}

// Default order constant to ensure we always have a fallback
const DEFAULT_STRUCTURE: SectionConfig[] = [
  { id: 'basics', type: 'basics', title: 'Personal Info', isVisible: true, order: 0 },
  { id: 'summary', type: 'summary', title: 'Professional Summary', isVisible: true, order: 1 },
  { id: 'experience', type: 'experience', title: 'Experience', isVisible: true, order: 2 },
  { id: 'education', type: 'education', title: 'Education', isVisible: true, order: 3 },
  { id: 'skills', type: 'skills', title: 'Skills', isVisible: true, order: 4 },
  { id: 'projects', type: 'projects', title: 'Projects', isVisible: true, order: 5 },
  { id: 'certifications', type: 'certifications', title: 'Certifications', isVisible: true, order: 6 },
];

export function ModernTemplate({ data, className = '' }: ModernTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications, structure } = data;
  const themeColor = data.metadata?.themeColor || '#000000';
  const fontName = data.metadata?.fontFamily || 'Inter';
  const fontSize = data.metadata?.fontSize || 'md';
  
  const scaleMap: Record<string, number> = { sm: 0.875, md: 1, lg: 1.125 };
  const scale = scaleMap[fontSize] || 1;

  // 1. Resolve the active structure
  const activeStructure = useMemo(() => {
    if (data.structure && data.structure.length > 0) {
      return [...data.structure].sort((a, b) => a.order - b.order);
    }
    return DEFAULT_STRUCTURE;
  }, [data.structure]);

  // 2. Helper to render sections
  const renderSection = (type: string, id: string) => {
    switch (type) {
      case 'basics':
        return (
          <div key={id} className="mb-6 pb-4 border-b border-gray-200">
            <h1 className="text-3xl font-bold mb-2" style={{ color: themeColor }}>{basics.name || 'Your Name'}</h1>
            <p className="text-xl text-gray-700 mb-3">{basics.title || 'Professional Title'}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {basics.location && <span>{basics.location}</span>}
              {basics.email && <span>{basics.email}</span>}
              {basics.phone && <span>{basics.phone}</span>}
              {basics.linkedin && <span>{basics.linkedin}</span>}
              {basics.github && <span>{basics.github}</span>}
            </div>
          </div>
        );
      case 'summary':
        if (!basics.summary) return null;
        return (
          <div key={id} className="mb-6">
            <h2 className="text-lg font-bold mb-2 uppercase tracking-wide" style={{ color: themeColor }}>Professional Summary</h2>
            <p className="text-gray-700 leading-relaxed">{basics.summary}</p>
          </div>
        );
      case 'experience':
        if (experiences.length === 0) return null;
        return (
          <div key={id} className="mb-6">
            <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: themeColor }}>Experience</h2>
            {experiences.map((exp, idx) => (
              <div key={exp.id || idx} className="mb-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-gray-900">{exp.role}</h3>
                    <p className="text-gray-700">{exp.company} • {exp.location}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </p>
                </div>
                <ul className="mt-2 space-y-1">
                  {exp.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="text-gray-700 pl-4 relative">
                      <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }}></span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      case 'education':
        if (education.length === 0) return null;
        return (
          <div key={id} className="mb-6">
            <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: themeColor }}>Education</h2>
            {education.map((edu, idx) => (
              <div key={edu.id || idx} className="mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{edu.institution}</h3>
                    <p className="text-gray-700">{edu.degree} in {edu.field}</p>
                    {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                  </div>
                  <p className="text-sm text-gray-600">
                    {edu.startDate} - {edu.endDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'skills':
        if (skills.length === 0) return null;
        return (
          <div key={id} className="mb-6">
            <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: themeColor }}>Skills</h2>
            {skills.map((group, idx) => (
              <div key={group.id || idx} className="mb-2">
                <span className="font-semibold text-gray-900">{group.name}: </span>
                <span className="text-gray-700">{group.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        );
      case 'projects':
        if (projects.length === 0) return null;
        return (
          <div key={id} className="mb-6">
            <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: themeColor }}>Projects</h2>
            {projects.map((project, idx) => (
              <div key={project.id || idx} className="mb-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900">{project.name}</h3>
                  {project.link && (
                    <a href={project.link} className="text-sm" style={{ color: themeColor }}>View Project</a>
                  )}
                </div>
                <p className="text-gray-700 text-sm mt-1">{project.description}</p>
                {project.technologies.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Technologies:</span> {project.technologies.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        );
      case 'certifications':
        if (certifications.length === 0) return null;
        return (
          <div key={id} className="mb-6">
            <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: themeColor }}>Certifications</h2>
            {certifications.map((cert, idx) => (
              <div key={cert.id || idx} className="mb-2">
                <p className="font-semibold text-gray-900">{cert.name}</p>
                <p className="text-sm text-gray-600">{cert.issuer} • {cert.date}</p>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id="resume-modern"
      className={`resume-template bg-white text-gray-900 p-12 ${className}`}
      style={{ 
        fontFamily: `"${fontName}", sans-serif`,
        zoom: scale
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;700&display=swap');
      `}</style>
      {activeStructure.map((section) => {
        if (section.isVisible === false) return null;
        return renderSection(section.type, section.id);
      })}
    </div>
  );
}