import type { ResumeData, SectionConfig } from '@/types';
import { useMemo } from 'react';

interface CreativeTemplateProps {
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

export function CreativeTemplate({ data, className = '' }: CreativeTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications } = data;

  const activeStructure = useMemo(() => {
    if (data.structure && data.structure.length > 0) {
      return [...data.structure].sort((a, b) => a.order - b.order);
    }
    return DEFAULT_STRUCTURE;
  }, [data.structure]);

  const renderSection = (section: SectionConfig) => {
    switch (section.type) {
      case 'education':
        if (education.length === 0) return null;
        return (
          <div key={section.id}>
            <h3 className="text-slate-400 uppercase tracking-widest text-sm font-bold border-b border-slate-700 pb-2 mb-4">Education</h3>
            <div className="space-y-6">
              {education.map((edu) => (
                <div key={edu.id}>
                  <h4 className="font-bold text-white leading-tight">{edu.institution}</h4>
                  <p className="text-slate-400 text-sm mt-1">{edu.degree}</p>
                  <p className="text-slate-500 text-xs mt-1 italic">{edu.field}</p>
                  <p className="text-slate-600 text-xs mt-1">
                    {edu.startDate} - {edu.endDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'skills':
        if (skills.length === 0) return null;
        return (
          <div key={section.id}>
            <h3 className="text-slate-400 uppercase tracking-widest text-sm font-bold border-b border-slate-700 pb-2 mb-4">Skills</h3>
            <div className="space-y-4">
              {skills.map((group) => (
                <div key={group.id}>
                  <p className="text-slate-300 font-semibold text-sm mb-2">{group.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill, idx) => (
                      <span key={idx} className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">
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
          <div key={section.id}>
            <h3 className="text-slate-400 uppercase tracking-widest text-sm font-bold border-b border-slate-700 pb-2 mb-4">Certifications</h3>
            <div className="space-y-4">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="text-slate-300 font-semibold text-sm">{cert.name}</p>
                  <p className="text-slate-500 text-xs italic">{cert.issuer}</p>
                  <p className="text-slate-600 text-xs">{cert.date}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'summary':
        if (!basics.summary) return null;
        return (
          <div key={section.id}>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-1 bg-slate-900 block"></span>
              About Me
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              {basics.summary}
            </p>
          </div>
        );
      case 'experience':
        if (experiences.length === 0) return null;
        return (
          <div key={section.id}>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-1 bg-slate-900 block"></span>
              Experience
            </h2>
            <div className="space-y-10">
              {experiences.map((exp) => (
                <div key={exp.id} className="relative pl-8 border-l border-slate-300">
                  <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 bg-slate-900 rounded-full ring-4 ring-slate-100"></div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{exp.role}</h3>
                    <span className="text-slate-500 font-mono text-sm bg-slate-200 px-2 py-1 rounded">
                      {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="text-slate-600 font-semibold mb-3">{exp.company} | {exp.location}</div>
                  <ul className="space-y-2">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="text-slate-600 leading-relaxed text-sm flex gap-2">
                        <span className="text-slate-400 mt-1">›</span>
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
          <div key={section.id}>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-1 bg-slate-900 block"></span>
              Projects
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 text-lg">{project.name}</h3>
                    {project.link && (
                      <a href={project.link} className="text-xs font-bold text-white bg-slate-900 px-2 py-1 rounded hover:bg-slate-700 transition-colors">VIEW</a>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm mb-3">{project.description}</p>
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, i) => (
                        <span key={i} className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          #{tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const sidebarSections = ['education', 'skills', 'certifications'];
  const mainSections = ['summary', 'experience', 'projects'];

  return (
    <div
      id="resume-creative"
      className={`resume-template bg-white text-gray-800 grid grid-cols-[300px_1fr] min-h-[1188px] ${className}`}
    >
      {/* Sidebar - Left Column */}
      <div className="bg-slate-900 text-white p-10 flex flex-col gap-8">
        {/* Photo Placeholder / Initials */}
        <div className="w-32 h-32 mx-auto bg-slate-700 rounded-full flex items-center justify-center border-4 border-slate-600">
           <span className="text-4xl font-bold tracking-widest">
            {basics.name ? basics.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'ME'}
           </span>
        </div>

        {/* Contact */}
        <div className="space-y-4 text-center sm:text-left">
            <h3 className="text-slate-400 uppercase tracking-widest text-sm font-bold border-b border-slate-700 pb-2 mb-4">Contact</h3>
            <div className="flex flex-col gap-3 text-sm font-light text-slate-300">
                {basics.email && (
                    <div className="break-all">
                        <span className="block text-slate-500 text-xs uppercase">Email</span>
                        {basics.email}
                    </div>
                )}
                {basics.phone && (
                    <div>
                         <span className="block text-slate-500 text-xs uppercase">Phone</span>
                        {basics.phone}
                    </div>
                )}
                {basics.location && (
                    <div>
                         <span className="block text-slate-500 text-xs uppercase">Location</span>
                        {basics.location}
                    </div>
                )}
                {basics.linkedin && (
                    <div className="break-all">
                         <span className="block text-slate-500 text-xs uppercase">LinkedIn</span>
                        {basics.linkedin.replace(/^https?:\/\//, '')}
                    </div>
                )}
                {basics.github && (
                    <div className="break-all">
                         <span className="block text-slate-500 text-xs uppercase">GitHub</span>
                        {basics.github.replace(/^https?:\/\//, '')}
                    </div>
                )}
            </div>
        </div>

        {/* Dynamic Sidebar Sections */}
        {activeStructure.map((section) => {
          if (sidebarSections.includes(section.type) && section.isVisible) {
            return renderSection(section);
          }
          return null;
        })}
      </div>

      {/* Main Content - Right Column */}
      <div className="p-12 flex flex-col gap-8 bg-slate-50">
        {/* Header Name & Title */}
        <div className="border-b-4 border-slate-900 pb-6">
            <h1 className="text-5xl font-extrabold text-slate-900 uppercase tracking-tighter leading-none mb-2">
                {basics.name?.split(' ')[0]} <span className="text-slate-400">{basics.name?.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-2xl text-slate-500 font-light tracking-widest uppercase">{basics.title}</p>
        </div>

        {/* Dynamic Main Sections */}
        {activeStructure.map((section) => {
          if (mainSections.includes(section.type) && section.isVisible) {
            return renderSection(section);
          }
          return null;
        })}
      </div>
    </div>
  );
}
