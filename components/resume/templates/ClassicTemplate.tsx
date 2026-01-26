import type { ResumeData } from "@/types";

interface ClassicTemplateProps {
  data: ResumeData;
  className?: string;
}

export function ClassicTemplate({ data, className = "" }: ClassicTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications } = data;
  const contactItems = [
    basics.phone,
    basics.email,
    basics.linkedin,
    basics.github,
    basics.location,
  ].filter(Boolean);

  return (
    <div
      id="resume-classic"
      className={`resume-template bg-white text-gray-900 px-10 py-8 font-sans ${className}`}
    >
      <div className="text-center border-b border-gray-200 pb-3 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {basics.name || "Your Name"}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {contactItems.length > 0 ? contactItems.join(" | ") : "Phone | Email | LinkedIn | Location"}
        </p>
      </div>

      {experiences.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-700 border-b border-gray-200 pb-1 mb-3">
            Experience
          </h2>
          <ul className="space-y-4">
            {experiences.map((exp) => (
              <li key={exp.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{exp.company || "Company Name"}</p>
                    <p className="text-sm italic text-gray-700">
                      {exp.role || "Job Title"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {exp.startDate || "Start"} - {exp.current ? "Present" : exp.endDate || "End"}
                  </p>
                </div>
                <ul className="mt-2 space-y-1">
                  {exp.bullets.map((bullet, idx) => (
                    <li key={idx} className="text-sm text-gray-700 pl-4 relative">
                      <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-gray-400" />
                      {bullet || "Add an achievement with measurable impact."}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-700 border-b border-gray-200 pb-1 mb-3">
            Projects
          </h2>
          <ul className="space-y-3">
            {projects.map((project) => (
              <li key={project.id}>
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-gray-900">{project.name || "Project Name"}</p>
                  {project.link && (
                    <span className="text-xs text-gray-500">{project.link}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{project.description || "Project description goes here."}</p>
                {project.technologies.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tech: {project.technologies.join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-700 border-b border-gray-200 pb-1 mb-3">
            Education
          </h2>
          <ul className="space-y-3">
            {education.map((edu) => (
              <li key={edu.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{edu.institution || "University Name"}</p>
                    <p className="text-sm text-gray-700">
                      {edu.degree || "Degree"} {edu.field ? `in ${edu.field}` : ""}
                    </p>
                    {edu.gpa && <p className="text-xs text-gray-500">GPA: {edu.gpa}</p>}
                  </div>
                  <p className="text-xs text-gray-500">
                    {edu.startDate || "Start"} - {edu.endDate || "End"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-700 border-b border-gray-200 pb-1 mb-3">
            Skills
          </h2>
          <div className="space-y-1 text-sm text-gray-700">
            {skills.map((group) => (
              <p key={group.id}>
                <span className="font-semibold text-gray-900">{group.name || "Category"}:</span>{" "}
                {group.skills.join(", ")}
              </p>
            ))}
          </div>
        </section>
      )}

      {certifications.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-700 border-b border-gray-200 pb-1 mb-3">
            Certifications
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {certifications.map((cert) => (
              <li key={cert.id}>
                <span className="font-semibold text-gray-900">{cert.name || "Certification"}</span>{" "}
                - {cert.issuer || "Issuer"} {cert.date ? `(${cert.date})` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
