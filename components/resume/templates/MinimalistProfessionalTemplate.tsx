"use client";

import type { ResumeData } from "@/types";
import { User, Mail, Phone, MapPin, Link as LinkIcon } from "lucide-react";
import { getFontScale } from "@/lib/typography";
import { RichText } from "@/components/editor/RichText";

interface MinimalistProfessionalTemplateProps {
  data: ResumeData;
  className?: string;
}

export function MinimalistProfessionalTemplate({
  data,
  className = "",
}: MinimalistProfessionalTemplateProps) {
  const { basics, experiences, education, skills, languages } = data;

  const fontName = data.metadata?.fontFamily || "Poppins";
  const nameFont = "Playfair Display";
  const fontSize = data.metadata?.fontSize;
  const scale = getFontScale(fontSize);

  const contactItems = [
    { value: basics.phone, icon: Phone },
    { value: basics.email, icon: Mail },
    { value: basics.location, icon: MapPin },
    { value: basics.linkedin, icon: LinkIcon },
    { value: basics.github, icon: LinkIcon },
    { value: basics.portfolio, icon: LinkIcon },
  ].filter((item) => Boolean(item.value));

  return (
    <div
      id="resume-minimalist-professional"
      className={`resume-template bg-white text-slate-800 min-h-[1188px] ${className}`}
      style={{
        fontFamily: `"${fontName}", sans-serif`,
        zoom: scale,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=${nameFont.replace(/ /g, "+")}:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="grid grid-cols-[280px_1fr] min-h-[1188px]">
        {/* Left column */}
        <aside className="bg-[#f7f7f7] border-r border-slate-200 px-8 py-10">
          <div className="flex flex-col items-start gap-6">
            <div className="w-40 h-40 rounded-full bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
              {basics.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={basics.image}
                  alt={basics.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-slate-400" />
              )}
            </div>

            <div>
              <h1
                className="text-3xl font-semibold text-slate-900 leading-tight"
                style={{ fontFamily: `"${nameFont}", serif` }}
              >
                {basics.name}
              </h1>
              <p className="mt-2 text-sm text-slate-500 tracking-wide uppercase">
                {basics.title}
              </p>
            </div>

            {contactItems.length > 0 && (
              <div className="w-full">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">
                  Contact
                </h2>
                <div className="mt-2 h-px w-10 bg-slate-300" />
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  {contactItems.map((item, idx) => {
                    const Icon = item.icon;
                    const value = String(item.value || "");
                    const cleaned = value.replace(/^https?:\/\//, "");
                    return (
                      <div key={`${value}-${idx}`} className="flex gap-2 items-start">
                        <Icon className="w-4 h-4 mt-0.5 text-slate-400" />
                        <span className="break-words">{cleaned}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {basics.summary && (
              <div className="w-full">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">
                  About Me
                </h2>
                <div className="mt-2 h-px w-10 bg-slate-300" />
                <RichText
                  text={basics.summary}
                  className="mt-4 text-sm text-slate-600 leading-relaxed"
                />
              </div>
            )}

            {skills.length > 0 && (
              <div className="w-full">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">
                  Skills
                </h2>
                <div className="mt-2 h-px w-10 bg-slate-300" />
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {skills.map((group) => (
                    <div key={group.id}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {group.name}
                      </p>
                      <ul className="mt-2 space-y-1 list-disc list-inside">
                        {group.skills.map((skill, idx) => (
                          <li key={`${group.id}-${idx}`}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div className="w-full">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">
                  Language
                </h2>
                <div className="mt-2 h-px w-10 bg-slate-300" />
                <ul className="mt-4 space-y-1 text-sm text-slate-600 list-disc list-inside">
                  {languages.map((language) => (
                      <li key={language.id}>
                        {language.name} {language.proficiency ? `(${language.proficiency})` : ""}
                      </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>

        {/* Right column */}
        <main className="px-10 py-10">
          {education.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-800">Education</h2>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="mt-6 space-y-6">
                {education.map((edu) => (
                  <div key={edu.id} className="grid grid-cols-[1fr_auto] gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {edu.degree || edu.field || "Education"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {edu.institution}
                        {edu.field ? ` | ${edu.field}` : ""}
                      </p>
                      {edu.gpa && (
                        <p className="text-xs text-slate-500 mt-1">GPA: {edu.gpa}</p>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {edu.startDate} - {edu.endDate}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {experiences.length > 0 && (
            <section>
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-800">Experience</h2>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="mt-6 space-y-8">
                {experiences.map((exp) => (
                  <div key={exp.id} className="grid grid-cols-[1fr_auto] gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{exp.role}</p>
                      <p className="text-xs text-slate-500">
                        {exp.company}
                        {exp.location ? ` | ${exp.location}` : ""}
                      </p>
                      {exp.bullets.length > 0 && (
                        <ul className="mt-3 space-y-1 text-sm text-slate-600 list-disc list-inside">
                          {exp.bullets.map((bullet, idx) => (
                            <li key={`${exp.id}-${idx}`}>
                              <RichText inline text={bullet} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                    </div>
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
