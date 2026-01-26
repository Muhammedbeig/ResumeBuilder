import type { ResumeData } from '@/types';

interface ATSTemplateProps {
  data: ResumeData;
  className?: string;
}

export function ATSTemplate({ data, className = '' }: ATSTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications } = data;

  return (
    <div
      id="resume-ats"
      className={`resume-template bg-white text-gray-900 p-8 font-sans ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b-2 border-gray-900">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{basics.name || 'Your Name'}</h1>
        <p className="text-lg text-gray-700 mb-2">{basics.title || 'Professional Title'}</p>
        <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600">
          {basics.location && <span>{basics.location}</span>}
          {basics.email && <span>• {basics.email}</span>}
          {basics.phone && <span>• {basics.phone}</span>}
          {basics.linkedin && <span>• LinkedIn</span>}
          {basics.github && <span>• GitHub</span>}
        </div>
      </div>

      {/* Summary */}
      {basics.summary && (
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-widest border-b border-gray-300 pb-1">Summary</h2>
          <p className="text-sm text-gray-700 leading-normal">{basics.summary}</p>
        </div>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-widest border-b border-gray-300 pb-1">Professional Experience</h2>
          {experiences.map((exp) => (
            <div key={exp.id} className="mb-4">
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
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-widest border-b border-gray-300 pb-1">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-2">
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
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-widest border-b border-gray-300 pb-1">Skills</h2>
          <div className="flex flex-wrap gap-1">
            {skills.flatMap(group => group.skills).map((skill, idx) => (
              <span key={idx} className="text-sm text-gray-700 bg-gray-100 px-2 py-0.5">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-widest border-b border-gray-300 pb-1">Projects</h2>
          {projects.map((project) => (
            <div key={project.id} className="mb-2">
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
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-widest border-b border-gray-300 pb-1">Certifications</h2>
          {certifications.map((cert) => (
            <div key={cert.id} className="mb-1">
              <p className="text-sm font-medium text-gray-900">{cert.name}</p>
              <p className="text-xs text-gray-600">{cert.issuer} • {cert.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
