import type { ResumeData, SectionConfig } from '@/types';
import { useMemo } from 'react';

interface ModernCVTemplateProps {
  data: ResumeData;
  className?: string;
}

const DEFAULT_STRUCTURE: SectionConfig[] = [
  { id: 'summary', type: 'summary', title: 'Profile', isVisible: true, order: 0 },
  { id: 'experience', type: 'experience', title: 'Experience', isVisible: true, order: 1 },
  { id: 'projects', type: 'projects', title: 'Projects', isVisible: true, order: 2 },
  { id: 'education', type: 'education', title: 'Education', isVisible: true, order: 3 },
  { id: 'skills', type: 'skills', title: 'Skills', isVisible: true, order: 4 },
  { id: 'certifications', type: 'certifications', title: 'Certifications', isVisible: true, order: 5 },
];

export function ModernCVTemplate({ data, className = '' }: ModernCVTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications, structure } = data;

  const activeStructure = useMemo(() => {
    if (data.structure && data.structure.length > 0) {
      return [...data.structure].sort((a, b) => a.order - b.order);
    }
    return DEFAULT_STRUCTURE;
  }, [data.structure]);

  // Split sections into Main (Left) and Sidebar (Right)
  // Main: Experience, Projects, Summary (if long)
  // Sidebar: Contact, Skills, Education, Certifications
  // Note: Since structure ordering is linear in the editor, we might need to hardcode layout zones 
  // or simple heuristic: if it's skills/education/certifications -> sidebar.
  
  const mainSections = activeStructure.filter(s => ['summary', 'experience', 'projects'].includes(s.type));
  const sidebarSections = activeStructure.filter(s => ['education', 'skills', 'certifications'].includes(s.type));

  const renderMainSection = (section: SectionConfig) => {
    if (!section.isVisible) return null;
    switch (section.type) {
      case 'summary':
        if (!basics.summary) return null;
        return (
          <div key={section.id} className="mb-8">
            <h2 className="text-xl font-bold text-teal-800 mb-3 border-b-2 border-teal-100 pb-2">Profile</h2>
            <p className="text-slate-600 leading-relaxed text-md">{basics.summary}</p>
          </div>
        );
      case 'experience':
        if (experiences.length === 0) return null;
        return (
          <div key={section.id} className="mb-8">
            <h2 className="text-xl font-bold text-teal-800 mb-4 border-b-2 border-teal-100 pb-2">Experience</h2>
            <div className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="relative pl-4 border-l-2 border-teal-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-1">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{exp.role}</h3>
                      <p className="text-teal-600 font-medium">{exp.company}</p>
                    </div>
                    <span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2 py-1 rounded mt-1 sm:mt-0">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{exp.location}</p>
                  <ul className="space-y-1.5">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="text-slate-600 text-sm">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      case 'projects':
        if (projects.length === 0) return null;
        return (
          <div key={section.id} className="mb-8">
            <h2 className="text-xl font-bold text-teal-800 mb-4 border-b-2 border-teal-100 pb-2">Key Projects</h2>
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="font-bold text-slate-800">{project.name}</h3>
                    {project.link && (
                      <a href={project.link} className="text-xs text-teal-600 hover:underline">View</a>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{project.description}</p>
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((t, i) => (
                        <span key={i} className="text-[10px] bg-white text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderSidebarSection = (section: SectionConfig) => {
    if (!section.isVisible) return null;
    switch (section.type) {
      case 'education':
        if (education.length === 0) return null;
        return (
          <div key={section.id} className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-teal-700 pb-1">Education</h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="font-bold text-teal-50">{edu.institution}</h3>
                  <p className="text-teal-100 text-sm">{edu.degree}</p>
                  {edu.field && <p className="text-teal-200 text-xs">{edu.field}</p>}
                  <p className="text-teal-300 text-xs mt-1">{edu.startDate} - {edu.endDate}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'skills':
        if (skills.length === 0) return null;
        return (
          <div key={section.id} className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-teal-700 pb-1">Skills</h2>
            <div className="space-y-3">
              {skills.map((group) => (
                <div key={group.id}>
                  <p className="text-teal-200 text-xs uppercase font-bold tracking-wider mb-1">{group.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill, i) => (
                      <span key={i} className="text-sm text-white bg-teal-800/50 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'certifications':
        if (certifications.length === 0) return null;
        return (
          <div key={section.id} className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-teal-700 pb-1">Certifications</h2>
            <div className="space-y-3">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="font-bold text-teal-50 text-sm">{cert.name}</p>
                  <p className="text-teal-200 text-xs">{cert.issuer}</p>
                  <p className="text-teal-300 text-xs">{cert.date}</p>
                </div>
              ))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div
      id="cv-modern"
      className={`resume-template flex flex-col md:flex-row min-h-[11in] bg-white font-sans ${className}`}
    >
      {/* Sidebar (Left) - Dark Teal */}
      <aside className="w-full md:w-1/3 bg-teal-900 text-white p-8">
        <div className="mb-8 text-center md:text-left">
            {basics.image && (
                <div className="w-32 h-32 mx-auto md:mx-0 mb-4 rounded-full overflow-hidden border-4 border-teal-700 shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={basics.image} alt={basics.name} className="w-full h-full object-cover" />
                </div>
            )}
            <h1 className="text-2xl font-bold mb-2 tracking-tight">{basics.name}</h1>
            <p className="text-teal-300 mb-6">{basics.title}</p>
            
            <div className="space-y-2 text-sm text-teal-100">
                {basics.email && <div className="break-all">{basics.email}</div>}
                {basics.phone && <div>{basics.phone}</div>}
                {basics.location && <div>{basics.location}</div>}
                {basics.linkedin && <div className="text-xs text-teal-400">{basics.linkedin.replace(/^https?:\/\//, '')}</div>}
                {basics.github && <div className="text-xs text-teal-400">{basics.github.replace(/^https?:\/\//, '')}</div>}
            </div>
        </div>

        {sidebarSections.map(section => renderSidebarSection(section))}
      </aside>

      {/* Main Content (Right) - White */}
      <main className="w-full md:w-2/3 p-8 md:p-12 text-slate-800">
        {mainSections.map(section => renderMainSection(section))}
      </main>
    </div>
  );
}
