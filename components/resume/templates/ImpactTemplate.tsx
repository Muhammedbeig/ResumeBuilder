import type { ResumeData, SectionConfig } from '@/types';
import { useMemo } from 'react';
import { Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react';

interface ImpactTemplateProps {
  data: ResumeData;
  className?: string;
}

const DEFAULT_STRUCTURE: SectionConfig[] = [
  { id: 'summary', type: 'summary', title: 'Summary', isVisible: true, order: 0 },
  { id: 'experience', type: 'experience', title: 'Experience', isVisible: true, order: 1 },
  { id: 'projects', type: 'projects', title: 'Projects', isVisible: true, order: 2 },
  { id: 'education', type: 'education', title: 'Education', isVisible: true, order: 3 },
  { id: 'skills', type: 'skills', title: 'Skills', isVisible: true, order: 4 },
  { id: 'certifications', type: 'certifications', title: 'Certifications', isVisible: true, order: 5 },
];

export function ImpactTemplate({ data, className = '' }: ImpactTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications } = data;
  const themeColor = data.metadata?.themeColor || '#1e293b'; // Default slate-800
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
          <div key={section.id} className="mb-8">
            <h2 className="text-xl font-bold uppercase tracking-wider mb-3 pb-1 border-b-2" style={{ color: themeColor, borderColor: themeColor }}>Profile</h2>
            <p className="text-gray-700 leading-relaxed">{basics.summary}</p>
          </div>
        );
      case 'experience':
        if (experiences.length === 0) return null;
        return (
          <div key={section.id} className="mb-8">
            <h2 className="text-xl font-bold uppercase tracking-wider mb-4 pb-1 border-b-2" style={{ color: themeColor, borderColor: themeColor }}>Experience</h2>
            <div className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{exp.role}</h3>
                    <span className="text-sm font-semibold text-gray-500 italic">
                      {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold" style={{ color: themeColor }}>{exp.company}</span>
                    <span className="text-gray-500 text-xs uppercase tracking-wide">{exp.location}</span>
                  </div>
                  <ul className="list-disc ml-5 space-y-1">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="text-sm text-gray-700 leading-relaxed">{bullet}</li>
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
            <h2 className="text-xl font-bold uppercase tracking-wider mb-4 pb-1 border-b-2" style={{ color: themeColor, borderColor: themeColor }}>Key Projects</h2>
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="bg-gray-50 p-4 rounded border-l-4" style={{ borderColor: themeColor }}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-gray-900">{project.name}</h3>
                    {project.link && <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: themeColor }}>PROJECT</span>}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{project.description}</p>
                  <p className="text-xs text-gray-500 font-medium">Tech: {project.technologies.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'education':
        if (education.length === 0) return null;
        return (
          <div key={section.id} className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-3">Education</h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <p className="font-bold text-white text-sm">{edu.institution}</p>
                  <p className="text-white/80 text-xs">{edu.degree}</p>
                  <p className="text-white/60 text-[10px] mt-1 italic">{edu.startDate} - {edu.endDate}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'skills':
        if (skills.length === 0) return null;
        return (
          <div key={section.id} className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-3">Expertise</h2>
            <div className="space-y-3">
              {skills.map((group) => (
                <div key={group.id}>
                  <p className="text-[10px] font-bold text-white/40 uppercase mb-1">{group.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {group.skills.map((skill, i) => (
                      <span key={i} className="text-xs text-white/90 bg-white/10 px-2 py-0.5 rounded">{skill}</span>
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
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-3">Awards</h2>
            <div className="space-y-2">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="text-xs font-bold text-white">{cert.name}</p>
                  <p className="text-[10px] text-white/60">{cert.issuer}</p>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const sidebarTypes = ['education', 'skills', 'certifications'];
  const mainTypes = ['summary', 'experience', 'projects'];

  return (
    <div
      id="resume-impact"
      className={`resume-template bg-white text-gray-800 grid grid-cols-[280px_1fr] min-h-[1188px] ${className}`}
      style={{ 
        fontFamily: `"${fontName}", sans-serif`,
        zoom: scale
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;700&display=swap');
      `}</style>

      {/* Sidebar */}
      <div className="p-10 text-white flex flex-col gap-8" style={{ backgroundColor: themeColor }}>
        <div className="text-center">
            {basics.image ? (
                <img src={basics.image} alt={basics.name} className="w-32 h-32 mx-auto rounded-xl object-cover mb-4 ring-4 ring-white/10" />
            ) : (
                <div className="w-32 h-32 mx-auto bg-white/10 rounded-xl flex items-center justify-center mb-4 ring-4 ring-white/10">
                    <span className="text-4xl font-bold">{basics.name?.[0]}</span>
                </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight mb-1">{basics.name}</h1>
            <p className="text-sm text-white/70 font-light uppercase tracking-widest">{basics.title}</p>
        </div>

        <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">Contact</h2>
            <div className="space-y-3 text-xs">
                {basics.email && <div className="flex items-center gap-2"><Mail size={12} className="text-white/40" /> {basics.email}</div>}
                {basics.phone && <div className="flex items-center gap-2"><Phone size={12} className="text-white/40" /> {basics.phone}</div>}
                {basics.location && <div className="flex items-center gap-2"><MapPin size={12} className="text-white/40" /> {basics.location}</div>}
                {basics.linkedin && <div className="flex items-center gap-2"><Linkedin size={12} className="text-white/40" /> LinkedIn</div>}
                {basics.github && <div className="flex items-center gap-2"><Github size={12} className="text-white/40" /> GitHub</div>}
            </div>
        </div>

        {activeStructure.map(s => sidebarTypes.includes(s.type) && s.isVisible ? renderSection(s) : null)}
      </div>

      {/* Main Content */}
      <div className="p-12">
        {activeStructure.map(s => mainTypes.includes(s.type) && s.isVisible ? renderSection(s) : null)}
      </div>
    </div>
  );
}