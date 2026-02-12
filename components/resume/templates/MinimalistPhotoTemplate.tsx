import type { ResumeData, SectionConfig } from '@/types';
import { User } from 'lucide-react';
import { useMemo } from 'react';
import { getFontScale } from '@/lib/typography';
import { RichText } from '@/components/editor/RichText';

interface MinimalistPhotoTemplateProps {
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

export function MinimalistPhotoTemplate({ data, className = '' }: MinimalistPhotoTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications } = data;
  const themeColor = data.metadata?.themeColor || '#8b5cf6'; // Default purple-500
  const fontName = data.metadata?.fontFamily || 'Inter';
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
      case 'skills':
        if (skills.length === 0) return null;
        return (
          <div key={section.id} className="mt-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.flatMap(group => group.skills).map((skill, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        );
      case 'education':
        if (education.length === 0) return null;
        return (
          <div key={section.id} className="mt-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">
              Education
            </h3>
            {education.map((edu) => (
              <div key={edu.id} className="mb-4 last:mb-0">
                <p className="font-bold text-sm text-gray-800">{edu.institution}</p>
                <p className="text-xs text-gray-600">{edu.degree}</p>
                <p className="text-xs text-gray-500 mt-1">{edu.startDate} - {edu.endDate}</p>
              </div>
            ))}
          </div>
        );
      case 'certifications':
        if (certifications.length === 0) return null;
        return (
          <div key={section.id} className="mt-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">
              Certifications
            </h3>
            {certifications.map((cert) => (
              <div key={cert.id} className="mb-4 last:mb-0">
                <p className="font-bold text-sm text-gray-800">{cert.name}</p>
                <p className="text-xs text-gray-600">{cert.issuer}</p>
                <p className="text-xs text-gray-500 mt-1">{cert.date}</p>
              </div>
            ))}
          </div>
        );
      case 'summary':
        if (!basics.summary) return null;
        return (
          <div key={section.id} className="mb-8">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-8 h-0.5" style={{ backgroundColor: themeColor }}></span>
              Profile
            </h2>
            <RichText text={basics.summary} className="text-gray-600 leading-relaxed text-sm" />
          </div>
        );
      case 'experience':
        if (experiences.length === 0) return null;
        return (
          <div key={section.id} className="mb-8">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5" style={{ backgroundColor: themeColor }}></span>
              Experience
            </h2>
            <div className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="relative pl-6 border-l-2 border-gray-100">
                  <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-white border-2" style={{ borderColor: themeColor }}></span>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-lg font-bold text-gray-800">{exp.role}</h3>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <p className="font-medium text-sm mb-2" style={{ color: themeColor }}>{exp.company}, {exp.location}</p>
                  <ul className="space-y-1.5">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="text-sm text-gray-600 leading-relaxed">
                        <RichText inline text={bullet} />
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
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5" style={{ backgroundColor: themeColor }}></span>
              Projects
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800">{project.name}</h3>
                    {project.link && (
                      <span className="text-xs bg-white px-2 py-0.5 rounded shadow-sm" style={{ color: themeColor }}>Link</span>
                    )}
                  </div>
                  <RichText text={project.description} className="text-sm text-gray-600 mb-2" />
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.map(t => (
                      <span key={t} className="text-[10px] uppercase font-bold text-gray-400">#{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const sidebarSections = ['skills', 'education', 'certifications'];
  const mainSections = ['summary', 'experience', 'projects'];

  return (
    <div
      id="resume-minimalist-photo"
      className={`resume-template bg-white text-gray-800 min-h-[1188px] relative ${className}`}
      style={{ 
        fontFamily: `"${fontName}", sans-serif`,
        zoom: scale
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;700&display=swap');
      `}</style>
      {/* Sidebar / Left Column */}
      <div className="absolute top-0 left-0 w-[260px] h-full bg-gray-50 border-r border-gray-100 p-10 flex flex-col gap-6">
        
        {/* Photo Placeholder */}
        <div className="w-40 h-40 mx-auto rounded-full bg-gray-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
            {basics.image ? (
              <img src={basics.image} alt={basics.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-20 h-20 text-gray-400" />
            )}
        </div>

        {/* Contact Info (Left Side) */}
        <div className="space-y-4 text-sm mt-4">
          {basics.email && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
              <p className="text-gray-700 break-words">{basics.email}</p>
            </div>
          )}
          {basics.phone && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Phone</p>
              <p className="text-gray-700">{basics.phone}</p>
            </div>
          )}
          {basics.location && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Location</p>
              <p className="text-gray-700">{basics.location}</p>
            </div>
          )}
          {(basics.linkedin || basics.github) && (
             <div>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Social</p>
               <div className="space-y-1">
                 {basics.linkedin && <p className="text-gray-700 break-words">{basics.linkedin.replace(/^https?:\/\//, '')}</p>}
                 {basics.github && <p className="text-gray-700 break-words">{basics.github.replace(/^https?:\/\//, '')}</p>}
               </div>
             </div>
          )}
        </div>

        {/* Dynamic Sidebar Sections */}
        {activeStructure.map((section) => {
          if (sidebarSections.includes(section.type) && section.isVisible) {
            return renderSection(section);
          }
          return null;
        })}
      </div>

      {/* Main Content / Right Column */}
      <div className="ml-[260px] p-12 pt-12">
        {/* Header Name/Title */}
        <div className="mb-10">
          <h1 className="text-5xl font-light text-gray-900 mb-2 tracking-tight">{basics.name}</h1>
          <p className="text-xl font-medium tracking-wide" style={{ color: themeColor }}>{basics.title}</p>
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
