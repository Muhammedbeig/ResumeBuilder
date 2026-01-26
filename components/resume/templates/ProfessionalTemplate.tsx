import type { ResumeData } from '@/types';

interface ProfessionalTemplateProps {
  data: ResumeData;
  className?: string;
}

export function ProfessionalTemplate({ data, className = '' }: ProfessionalTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications } = data;

  return (
    <div
      id="resume-professional"
      className={`resume-template bg-white text-slate-800 p-8 font-serif ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-2 border-slate-900">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight uppercase">{basics.name || 'Your Name'}</h1>
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

      {/* Summary */}
      {basics.summary && (
        <div className="mb-8 max-w-3xl mx-auto text-center">
          <p className="text-slate-700 leading-relaxed italic text-lg">{basics.summary}</p>
        </div>
      )}

      {/* Skills - Top Bar */}
      {skills.length > 0 && (
        <div className="mb-8 py-4 bg-slate-50 border-y border-slate-200">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {skills.map((group) => (
              <div key={group.id} className="flex flex-col items-center">
                <span className="font-bold text-slate-900 mb-1 uppercase text-xs tracking-wider">{group.name}</span>
                <span className="text-slate-600 text-center">{group.skills.join(' • ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 font-sans">
        {/* Experience */}
        {experiences.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-4">
              <span className="flex-1 h-px bg-slate-300"></span>
              <span className="uppercase tracking-widest">Experience</span>
              <span className="flex-1 h-px bg-slate-300"></span>
            </h2>
            <div className="space-y-8">
              {experiences.map((exp) => (
                <div key={exp.id} className="relative pl-6 border-l-2 border-slate-200">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-slate-900 rounded-full"></div>
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{exp.role}</h3>
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
                        <span className="mt-2 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Education */}
          {education.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-widest border-b border-slate-200 pb-2">
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
          )}

          {/* Projects & Certifications Combined Column */}
          <div className="space-y-8">
            {projects.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-widest border-b border-slate-200 pb-2">
                  Projects
                </h2>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id}>
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-bold text-slate-900">{project.name}</h3>
                        {project.link && (
                          <a href={project.link} className="text-xs text-blue-600 hover:underline">Link</a>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{project.description}</p>
                      {project.technologies.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1 italic">
                          {project.technologies.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {certifications.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-widest border-b border-slate-200 pb-2">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
