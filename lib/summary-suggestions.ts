import type { Experience, SkillGroup } from "@/types";

const uniqueList = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trim();
    if (!key) return false;
    const normalized = key.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const toSentenceList = (items: string[]) => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

export const getSummarySuggestions = (
  title: string,
  experiences: Experience[],
  skills: SkillGroup[],
  limit = 3
) => {
  const cleanTitle = title?.trim() || "professional";
  const roleCompany = uniqueList(
    experiences
      .map((exp) => {
        const role = exp.role?.trim();
        const company = exp.company?.trim();
        if (role && company) return `${role} at ${company}`;
        return role || company || "";
      })
      .filter(Boolean)
  ).slice(0, 3);

  const roleText = roleCompany.length > 0 ? toSentenceList(roleCompany) : "diverse roles";

  const skillList = uniqueList(
    skills.flatMap((group) => group.skills.map((skill) => skill.trim()))
  ).slice(0, 6);

  const skillText = skillList.length > 0 ? toSentenceList(skillList) : "core tools and best practices";

  const suggestions = [
    `Results-driven ${cleanTitle} with experience in ${roleText}. Skilled in ${skillText} with a focus on measurable impact.`,
    `Detail-oriented ${cleanTitle} contributing across ${roleText}. Known for collaboration, problem-solving, and consistent delivery.`,
    `Versatile ${cleanTitle} delivering outcomes across ${roleText}. Brings strengths in ${skillText} and continuous improvement.`,
  ];

  return uniqueList(suggestions).slice(0, limit);
};
