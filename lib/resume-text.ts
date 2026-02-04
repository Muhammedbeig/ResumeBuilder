import type { ResumeData } from "@/types";

type ResumeTextOptions = {
  shareUrl?: string;
  includeBranding?: boolean;
};

const join = (parts: Array<string | undefined | null>) =>
  parts.map((part) => (part ?? "").trim()).filter(Boolean).join(" | ");

export function buildResumeText(data: ResumeData, options: ResumeTextOptions = {}) {
  const lines: string[] = [];

  if (data.basics.name) lines.push(data.basics.name);
  if (data.basics.title) lines.push(data.basics.title);

  const contact = join([
    data.basics.email,
    data.basics.phone,
    data.basics.location,
    data.basics.linkedin,
    data.basics.github,
  ]);
  if (contact) {
    lines.push("");
    lines.push("Contact");
    lines.push(contact);
  }

  if (data.basics.summary) {
    lines.push("");
    lines.push("Summary");
    lines.push(data.basics.summary);
  }

  if (data.experiences.length > 0) {
    lines.push("");
    lines.push("Experience");
    data.experiences.forEach((exp) => {
      const header = join([
        exp.role ? `${exp.role}` : undefined,
        exp.company ? `@ ${exp.company}` : undefined,
      ]).replace(" @ ", " @ ");
      const dates = join([exp.startDate, exp.current ? "Present" : exp.endDate]);
      lines.push("");
      lines.push(header || "Role");
      if (exp.location || dates) lines.push(join([exp.location, dates]));
      exp.bullets.forEach((bullet) => {
        if (bullet.trim()) lines.push(`- ${bullet.trim()}`);
      });
    });
  }

  if (data.education.length > 0) {
    lines.push("");
    lines.push("Education");
    data.education.forEach((edu) => {
      const header = join([edu.degree, edu.field]).trim();
      lines.push("");
      lines.push(header || edu.institution || "Education");
      if (edu.institution) lines.push(edu.institution);
      lines.push(join([edu.startDate, edu.endDate, edu.gpa ? `GPA: ${edu.gpa}` : undefined]));
    });
  }

  if (data.skills.length > 0) {
    lines.push("");
    lines.push("Skills");
    data.skills.forEach((group) => {
      const groupLabel = group.name ? `${group.name}: ` : "";
      lines.push(`${groupLabel}${group.skills.join(", ")}`);
    });
  }

  if (data.projects.length > 0) {
    lines.push("");
    lines.push("Projects");
    data.projects.forEach((project) => {
      lines.push("");
      lines.push(project.name || "Project");
      if (project.description) lines.push(project.description);
      if (project.technologies?.length) {
        lines.push(`Tech: ${project.technologies.join(", ")}`);
      }
      const links = join([project.link, project.github]);
      if (links) lines.push(links);
    });
  }

  if (data.certifications.length > 0) {
    lines.push("");
    lines.push("Certifications");
    data.certifications.forEach((cert) => {
      lines.push(join([cert.name, cert.issuer, cert.date, cert.link]));
    });
  }

  if (options.includeBranding && options.shareUrl) {
    lines.push("");
    lines.push(`View online: ${options.shareUrl}`);
    lines.push("Created with ResuPro");
  }

  return lines.filter(Boolean).join("\n");
}

export function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
