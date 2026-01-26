import type { ResumeData } from "@/types";

interface ExecutiveTemplateProps {
  data: ResumeData;
  className?: string;
}

export function ExecutiveTemplate({ data, className = "" }: ExecutiveTemplateProps) {
  return (
    <div
      id="resume-executive"
      className={`resume-template bg-white text-gray-900 p-8 font-sans ${className}`}
    >
      <header className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {data.basics.name || "Your Name"}
            </h1>
            <p className="text-sm text-gray-600">
              {data.basics.title || "Professional Title"}
            </p>
          </div>
          <div className="text-xs text-right text-gray-600 space-y-1">
            {data.basics.email && <div>{data.basics.email}</div>}
            {data.basics.phone && <div>{data.basics.phone}</div>}
            {data.basics.location && <div>{data.basics.location}</div>}
            {data.basics.linkedin && <div>{data.basics.linkedin}</div>}
            {data.basics.github && <div>{data.basics.github}</div>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6">
        <aside className="col-span-1 space-y-4">
          {data.skills.length > 0 && (
            <section className="resume-section">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
                Skills
              </h2>
              <div className="space-y-2">
                {data.skills.map((group) => (
                  <div key={group.id}>
                    <p className="text-xs font-semibold text-gray-700">{group.name}</p>
                    <p className="text-xs text-gray-600">{group.skills.join(", ")}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.education.length > 0 && (
            <section className="resume-section">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
                Education
              </h2>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id}>
                    <p className="text-sm font-semibold text-gray-900">{edu.institution}</p>
                    <p className="text-xs text-gray-600">
                      {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {edu.startDate} - {edu.endDate}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.certifications.length > 0 && (
            <section className="resume-section">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
                Certifications
              </h2>
              <div className="space-y-2">
                {data.certifications.map((cert) => (
                  <div key={cert.id}>
                    <p className="text-sm font-semibold text-gray-900">{cert.name}</p>
                    <p className="text-xs text-gray-600">{cert.issuer}</p>
                    <p className="text-xs text-gray-500">{cert.date}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.languages.length > 0 && (
            <section className="resume-section">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
                Languages
              </h2>
              <div className="space-y-1 text-xs text-gray-600">
                {data.languages.map((language) => (
                  <div key={language.id}>
                    {language.name} - {language.proficiency}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        <main className="col-span-2 space-y-5">
          {data.basics.summary && (
            <section className="resume-section">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
                Summary
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">{data.basics.summary}</p>
            </section>
          )}

          {data.experiences.length > 0 && (
            <section className="resume-section">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
                Experience
              </h2>
              <div className="space-y-4">
                {data.experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{exp.role}</p>
                        <p className="text-xs text-gray-600">
                          {exp.company} {exp.location ? `- ${exp.location}` : ""}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                      </p>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-gray-700 list-disc pl-4">
                      {exp.bullets.map((bullet, index) => (
                        <li key={index}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.projects.length > 0 && (
            <section className="resume-section">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 mb-2">
                Projects
              </h2>
              <div className="space-y-3">
                {data.projects.map((project) => (
                  <div key={project.id}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{project.name}</p>
                      {project.link && (
                        <span className="text-xs text-gray-500">{project.link}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{project.description}</p>
                    {project.technologies.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Tech: {project.technologies.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
