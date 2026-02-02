import type { Experience } from "@/types";

type SkillBucket = {
  keywords: string[];
  skills: string[];
};

const uniqueList = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const trimmed = item.trim();
    if (!trimmed) return false;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const SKILL_BUCKETS: SkillBucket[] = [
  {
    keywords: ["machine learning", "ml", "ai", "data scientist", "deep learning", "model"],
    skills: [
      "Python",
      "PyTorch",
      "TensorFlow",
      "XGBoost",
      "scikit-learn",
      "Pandas",
      "NumPy",
      "Jupyter",
      "MLflow",
      "SQL",
      "Hugging Face",
    ],
  },
  {
    keywords: ["data analyst", "analytics", "bi", "dashboard", "insights"],
    skills: ["SQL", "Excel", "Power BI", "Tableau", "Python", "Pandas", "Looker"],
  },
  {
    keywords: ["frontend", "front end", "ui", "ux", "web", "react", "javascript"],
    skills: [
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Tailwind CSS",
      "Redux",
      "Figma",
    ],
  },
  {
    keywords: ["backend", "back end", "api", "server", "node", "django", "flask"],
    skills: [
      "Node.js",
      "Express",
      "NestJS",
      "Python",
      "Django",
      "Flask",
      "PostgreSQL",
      "Redis",
      "REST",
      "GraphQL",
    ],
  },
  {
    keywords: ["devops", "sre", "cloud", "aws", "azure", "gcp", "kubernetes"],
    skills: [
      "Docker",
      "Kubernetes",
      "AWS",
      "Azure",
      "GCP",
      "Terraform",
      "GitHub Actions",
      "Jenkins",
      "Linux",
      "Prometheus",
    ],
  },
  {
    keywords: ["qa", "quality", "test", "automation"],
    skills: ["Selenium", "Cypress", "Playwright", "Jest", "Postman", "JMeter"],
  },
  {
    keywords: ["mobile", "android", "ios", "react native", "flutter"],
    skills: ["Kotlin", "Swift", "React Native", "Flutter", "Dart", "Firebase"],
  },
  {
    keywords: ["security", "cyber", "infosec", "soc"],
    skills: ["Splunk", "SIEM", "OWASP", "Nmap", "Burp Suite", "Wireshark"],
  },
  {
    keywords: ["product manager", "product owner", "roadmap", "agile"],
    skills: ["Jira", "Agile", "Scrum", "OKRs", "A/B Testing", "Product Analytics"],
  },
  {
    keywords: ["marketing", "seo", "growth", "content", "campaign"],
    skills: ["Google Analytics", "SEO", "Google Ads", "Meta Ads", "HubSpot"],
  },
  {
    keywords: ["finance", "accountant", "audit", "tax"],
    skills: ["Excel", "QuickBooks", "SAP", "Oracle", "Power BI"],
  },
];

const FALLBACK_SKILLS = [
  "Microsoft Excel",
  "Google Workspace",
  "Git",
  "Jira",
  "Notion",
  "Slack",
];

const buildSignalText = (title?: string, experiences?: Experience[]) => {
  const parts: string[] = [];
  if (title) parts.push(title);
  if (experiences && experiences.length > 0) {
    experiences.forEach((exp) => {
      parts.push(exp.role || "");
      parts.push(exp.company || "");
      if (exp.bullets && exp.bullets.length > 0) {
        parts.push(exp.bullets.join(" "));
      }
    });
  }
  return parts.join(" ").toLowerCase();
};

const buildSignalTextFromRaw = (inputs: string[]) =>
  inputs.join(" ").toLowerCase();

export const getSkillSuggestionsFromProfile = (
  title: string,
  experiences: Experience[],
  limit = 20
) => {
  const signal = buildSignalText(title, experiences);
  const skills = SKILL_BUCKETS.filter((bucket) =>
    bucket.keywords.some((keyword) => signal.includes(keyword))
  ).flatMap((bucket) => bucket.skills);

  const result = uniqueList(skills);
  return result.length > 0 ? result.slice(0, limit) : FALLBACK_SKILLS.slice(0, limit);
};

export const getSkillSuggestionsFromText = (inputs: string[], limit = 20) => {
  const signal = buildSignalTextFromRaw(inputs);
  const skills = SKILL_BUCKETS.filter((bucket) =>
    bucket.keywords.some((keyword) => signal.includes(keyword))
  ).flatMap((bucket) => bucket.skills);

  const result = uniqueList(skills);
  return result.length > 0 ? result.slice(0, limit) : FALLBACK_SKILLS.slice(0, limit);
};

export const mergeSkillSuggestions = (lists: string[][], limit = 30) => {
  return uniqueList(lists.flat()).slice(0, limit);
};
