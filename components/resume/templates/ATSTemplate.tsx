import type { ResumeData, SectionConfig } from '@/types';
import { useMemo } from 'react';

interface ATSTemplateProps {
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

export function ATSTemplate({ data, className = '' }: ATSTemplateProps) {
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
          <div key={section.id} className="mb-5">
            <h2 className="text-base font-bold mb-2 uppercase tracking-widest border-b pb-1" style={{ color: themeColor, borderColor: themeColor }}>Summary</h2>
            <p className="text-sm text-gray-700 leading-normal">{basics.summary}</p>
          </div>
        );
      case 'experience':
        if (experiences.length === 0) return null;
        return (
          <div key={section.id} className="mb-5">
            <h2 className="text-base font-bold mb-2 uppercase tracking-widest border-b pb-1" style={{ color: themeColor, borderColor: themeColor }}>Professional Experience</h2>
            {experiences.map((exp, idx) => (
              <div key={exp.id || idx} className="mb-4">
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{exp.role}</h3>
                    <p className="text-sm text-gray-700 italic">{exp.company}</p>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </p>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {exp.bullets.map((bullet, idx) => (
                    <li key={idx} className="text-sm text-gray-700 pl-3">
                      • {bullet}
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
          <div key={section.id} className="mb-5">
            <h2 className="text-base font-bold mb-2 uppercase tracking-widest border-b pb-1" style={{ color: themeColor, borderColor: themeColor }}>Education</h2>
            {education.map((edu, idx) => (
              <div key={edu.id || idx} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{edu.institution}</h3>
                    <p className="text-sm text-gray-700">{edu.degree} in {edu.field}</p>
                    {edu.gpa && <p className="text-xs text-gray-600">GPA: {edu.gpa}</p>}
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    {edu.startDate} – {edu.endDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'skills':
        if (skills.length === 0) return null;
        return (
          <div key={section.id} className="mb-5">
            <h2 className="text-base font-bold mb-2 uppercase tracking-widest border-b pb-1" style={{ color: themeColor, borderColor: themeColor }}>Skills</h2>
            <div className="flex flex-wrap gap-1">
              {skills.flatMap(group => group.skills).map((skill, idx) => (
                <span key={idx} className="text-sm text-gray-700 bg-gray-100 px-2 py-0.5">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        );
      case 'projects':
        if (projects.length === 0) return null;
        return (
          <div key={section.id} className="mb-5">
            <h2 className="text-base font-bold mb-2 uppercase tracking-widest border-b pb-1" style={{ color: themeColor, borderColor: themeColor }}>Projects</h2>
            {projects.map((project, idx) => (
              <div key={project.id || idx} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-900 text-sm">{project.name}</h3>
                </div>
                <p className="text-sm text-gray-700">{project.description}</p>
                {project.technologies.length > 0 && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    Tech: {project.technologies.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        );
      case 'certifications':
        if (certifications.length === 0) return null;
        return (
          <div key={section.id} className="mb-5">
            <h2 className="text-base font-bold mb-2 uppercase tracking-widest border-b pb-1" style={{ color: themeColor, borderColor: themeColor }}>Certifications</h2>
            {certifications.map((cert, idx) => (
              <div key={cert.id || idx} className="mb-1">
                <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                <p className="text-xs text-gray-600">{cert.issuer} • {cert.date}</p>
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
      id="resume-ats"
      className={`resume-template bg-white text-gray-900 p-12 ${className}`}
      style={{ 
        fontFamily: `"${fontName}", sans-serif`,
        zoom: scale
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;700&display=swap');
      `}</style>
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b-2" style={{ borderColor: themeColor }}>
        <h1 className="text-3xl font-bold mb-1" style={{ color: themeColor }}>{basics.name || 'Your Name'}</h1>
        <p className="text-lg text-gray-700 mb-2">{basics.title || 'Professional Title'}</p>
        <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600">
          {basics.location && <span>{basics.location}</span>}
          {basics.email && <span>• {basics.email}</span>}
          {basics.phone && <span>• {basics.phone}</span>}
          {basics.linkedin && <span>• LinkedIn</span>}
          {basics.github && <span>• GitHub</span>}
        </div>
      </div>

      {activeStructure.map((section) => {
        if (!section.isVisible || section.type === 'basics') return null;
        return renderSection(section);
      })}
    </div>
  );
}