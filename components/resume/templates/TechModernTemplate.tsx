import type { ResumeData } from '@/types';
import { User, MapPin, Mail, Phone, Globe, Github, Linkedin } from 'lucide-react';

interface TechModernTemplateProps {
  data: ResumeData;
  className?: string;
}

export function TechModernTemplate({ data, className = '' }: TechModernTemplateProps) {
  const { basics, experiences, education, skills, projects, certifications } = data;

  return (
    <div
      id="resume-tech-modern"
      className={`resume-template bg-white text-slate-800 font-sans min-h-[1123px] flex flex-col ${className}`}
    >
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex gap-8 items-center">
             {/* Photo */}
             <div className="w-32 h-32 shrink-0 bg-slate-800 rounded-xl border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-2xl rotate-3">
                 {data.basics.image ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={data.basics.image} alt={data.basics.name} className="w-full h-full object-cover" />
                 ) : (
                   <User className="w-16 h-16 text-slate-600" />
                 )}
             </div>
             
             <div className="flex-1">
                 <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">
                    {basics.name}
                 </h1>
                 <p className="text-xl text-cyan-400 font-medium mb-4">{basics.title}</p>
                 
                 <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                     {basics.email && (
                         <div className="flex items-center gap-1.5">
                             <Mail className="w-3.5 h-3.5" />
                             <span>{basics.email}</span>
                         </div>
                     )}
                     {basics.phone && (
                         <div className="flex items-center gap-1.5">
                             <Phone className="w-3.5 h-3.5" />
                             <span>{basics.phone}</span>
                         </div>
                     )}
                     {basics.location && (
                         <div className="flex items-center gap-1.5">
                             <MapPin className="w-3.5 h-3.5" />
                             <span>{basics.location}</span>
                         </div>
                     )}
                 </div>
                 
                 <div className="flex gap-4 mt-3 text-sm text-slate-400">
                    {basics.linkedin && (
                        <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <Linkedin className="w-3.5 h-3.5" />
                            <span>LinkedIn</span>
                        </div>
                    )}
                    {basics.github && (
                        <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <Github className="w-3.5 h-3.5" />
                            <span>GitHub</span>
                        </div>
                    )}
                 </div>
             </div>
        </div>
      </div>

      <div className="flex flex-1">
          {/* Main Content */}
          <div className="flex-1 p-8 space-y-8">
              
              {/* Summary */}
              {basics.summary && (
                  <div>
                      <h2 className="text-lg font-bold text-slate-900 border-l-4 border-cyan-500 pl-3 mb-3">About Me</h2>
                      <p className="text-slate-600 leading-relaxed text-sm">
                          {basics.summary}
                      </p>
                  </div>
              )}

              {/* Experience */}
              {experiences.length > 0 && (
                  <div>
                      <h2 className="text-lg font-bold text-slate-900 border-l-4 border-purple-500 pl-3 mb-4">Work Experience</h2>
                      <div className="space-y-6">
                          {experiences.map((exp) => (
                              <div key={exp.id} className="relative">
                                  <div className="flex justify-between items-baseline mb-1">
                                      <h3 className="font-bold text-slate-800">{exp.role}</h3>
                                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                          {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                      </span>
                                  </div>
                                  <p className="text-sm font-medium text-cyan-700 mb-2">{exp.company} • {exp.location}</p>
                                  <ul className="list-disc list-outside ml-4 space-y-1">
                                      {exp.bullets.map((bullet, idx) => (
                                          <li key={idx} className="text-sm text-slate-600 pl-1">{bullet}</li>
                                      ))}
                                  </ul>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                  <div>
                      <h2 className="text-lg font-bold text-slate-900 border-l-4 border-pink-500 pl-3 mb-4">Featured Projects</h2>
                      <div className="grid grid-cols-1 gap-4">
                          {projects.map((project) => (
                              <div key={project.id}>
                                  <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-slate-800">{project.name}</h3>
                                      {project.link && <Globe className="w-3 h-3 text-slate-400" />}
                                  </div>
                                  <p className="text-sm text-slate-600 mb-2">{project.description}</p>
                                  <div className="flex flex-wrap gap-2">
                                      {project.technologies.map(t => (
                                          <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full border border-slate-200">
                                              {t}
                                          </span>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>

          {/* Right Sidebar */}
          <div className="w-64 bg-slate-50 border-l border-slate-200 p-8 space-y-8">
              {/* Skills */}
              {skills.length > 0 && (
                  <div>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 text-center">Skills & Tech</h2>
                      <div className="space-y-4">
                          {skills.map(group => (
                              <div key={group.id}>
                                  <h3 className="text-xs font-semibold text-slate-400 mb-2">{group.name}</h3>
                                  <div className="flex flex-wrap gap-2">
                                      {group.skills.map((skill, i) => (
                                          <span key={i} className="text-sm font-medium text-slate-700 bg-white px-2 py-1 rounded shadow-sm w-full text-center border border-slate-100">
                                              {skill}
                                          </span>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Education */}
              {education.length > 0 && (
                  <div>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 text-center">Education</h2>
                      <div className="space-y-4">
                          {education.map((edu) => (
                              <div key={edu.id} className="text-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                  <div className="font-bold text-slate-800 text-sm mb-1">{edu.institution}</div>
                                  <div className="text-xs text-cyan-700 font-medium mb-1">{edu.degree}</div>
                                  <div className="text-[10px] text-slate-400">{edu.startDate} - {edu.endDate}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
              
              {/* Certifications */}
              {certifications.length > 0 && (
                   <div>
                       <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 text-center">Certifications</h2>
                       <ul className="space-y-3">
                           {certifications.map((cert) => (
                               <li key={cert.id} className="text-center">
                                   <div className="text-sm font-medium text-slate-700">{cert.name}</div>
                                   <div className="text-xs text-slate-500">{cert.issuer}</div>
                               </li>
                           ))}
                       </ul>
                   </div>
              )}
          </div>
      </div>
    </div>
  );
}
