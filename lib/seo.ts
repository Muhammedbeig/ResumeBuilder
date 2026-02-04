export type SeoConfig = {
  title: string;
  description: string;
  keywords?: string[];
  noindex?: boolean;
};

export const DEFAULT_SEO: SeoConfig = {
  title: "ResuPro — AI Resume Builder",
  description:
    "Build ATS-friendly resumes, CVs, and cover letters with smart templates and guided editing.",
};

const ROUTE_SEO: Record<string, SeoConfig> = {
  "/": {
    title: "ResuPro — AI Resume Builder",
    description:
      "Build ATS-winning resumes with guided templates, smart suggestions, and clean exports.",
    keywords: ["resume builder", "ATS resume", "CV builder", "cover letter"],
  },
  "/choose-builder": {
    title: "Choose Your Builder | ResuPro",
    description: "Pick resume, CV, or cover letter workflows tailored to your goals.",
  },
  "/pricing": {
    title: "Pricing & Plans | ResuPro",
    description: "Compare free and paid plans for resumes, CVs, and AI-powered features.",
  },
  "/login": {
    title: "Sign In | ResuPro",
    description: "Access your resumes, CVs, and cover letters in one place.",
  },
  "/signup": {
    title: "Create an Account | ResuPro",
    description: "Join ResuPro to save resumes and unlock premium templates.",
  },
  "/dashboard": {
    title: "Dashboard | ResuPro",
    description: "Manage your resumes, CVs, and cover letters.",
    noindex: true,
  },
  "/templates": {
    title: "Resume Templates | ResuPro",
    description: "Browse ATS-friendly resume templates for every industry.",
  },
  "/ats-checker": {
    title: "ATS Checker | ResuPro",
    description: "Analyze your resume against ATS requirements and improve match rate.",
  },
  "/editor": {
    title: "Resume Editor | ResuPro",
    description: "Edit your resume with guided sections and smart formatting.",
    noindex: true,
  },
  "/resume/start": {
    title: "Start a Resume | ResuPro",
    description: "Upload or start a resume from scratch with guided steps.",
  },
  "/resume/new": {
    title: "Select a Resume Template | ResuPro",
    description: "Choose a template to start building your resume.",
  },
  "/resume-preview": {
    title: "Resume Preview | ResuPro",
    description: "Preview your resume before exporting.",
    noindex: true,
  },
  "/cv/start": {
    title: "Start a CV | ResuPro",
    description: "Build an academic or professional CV with structured sections.",
  },
  "/cv/new": {
    title: "Select a CV Template | ResuPro",
    description: "Pick a CV template and start editing.",
  },
  "/cover-letter/start": {
    title: "Start a Cover Letter | ResuPro",
    description: "Create a cover letter from scratch or import one.",
  },
  "/cover-letter/new": {
    title: "Select a Cover Letter Template | ResuPro",
    description: "Choose a cover letter layout and begin writing.",
  },
  "/cover-letter/templates": {
    title: "Cover Letter Templates | ResuPro",
    description: "Browse professional cover letter templates.",
  },
  "/ai-resume-optimizer": {
    title: "AI Resume Optimizer | ResuPro",
    description: "Optimize your resume with AI-powered tailoring and insights.",
  },
  "/career-blog": {
    title: "Career Blog | ResuPro",
    description: "Read career advice, playbooks, and job search strategies.",
  },
  "/about": {
    title: "About ResuPro",
    description: "Learn how ResuPro helps job seekers build stronger resumes.",
  },
  "/about/story": {
    title: "Our Story | ResuPro",
    description: "The mission and values behind ResuPro.",
  },
  "/about/press": {
    title: "Press | ResuPro",
    description: "Press resources and brand guidelines for ResuPro.",
  },
  "/about/careers": {
    title: "Careers | ResuPro",
    description: "Join the team building the future of career tools.",
  },
};

const DYNAMIC_ROUTES: Array<{ pattern: RegExp; key: string; param: string }> = [
  { pattern: /^\/career-blog\/category\/([^/]+)$/, key: "/career-blog/category/[slug]", param: "slug" },
  { pattern: /^\/career-blog\/([^/]+)$/, key: "/career-blog/[slug]", param: "slug" },
  { pattern: /^\/resume\/([^/]+)$/, key: "/resume/[id]", param: "id" },
  { pattern: /^\/cv\/([^/]+)$/, key: "/cv/[id]", param: "id" },
  { pattern: /^\/cover-letter\/([^/]+)$/, key: "/cover-letter/[id]", param: "id" },
  { pattern: /^\/shared\/([^/]+)$/, key: "/shared/[id]", param: "id" },
];

const DYNAMIC_SEO: Record<string, SeoConfig> = {
  "/career-blog/category/[slug]": {
    title: "{slug} Career Articles | ResuPro",
    description: "Browse {slug} career articles, guides, and job search tactics.",
  },
  "/career-blog/[slug]": {
    title: "{slug} | ResuPro Career Blog",
    description: "Read {slug} on the ResuPro career blog.",
  },
  "/resume/[id]": {
    title: "Resume Editor | ResuPro",
    description: "Edit and update your resume.",
    noindex: true,
  },
  "/cv/[id]": {
    title: "CV Editor | ResuPro",
    description: "Edit and update your CV.",
    noindex: true,
  },
  "/cover-letter/[id]": {
    title: "Cover Letter Editor | ResuPro",
    description: "Edit and update your cover letter.",
    noindex: true,
  },
  "/shared/[id]": {
    title: "Shared Resume | ResuPro",
    description: "View a shared resume on ResuPro.",
  },
};

const humanize = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const applyTemplate = (template: SeoConfig, params: Record<string, string>) => {
  const inject = (text: string) =>
    Object.entries(params).reduce(
      (acc, [key, value]) => acc.replaceAll(`{${key}}`, humanize(value)),
      text
    );

  return {
    ...template,
    title: inject(template.title),
    description: inject(template.description),
  };
};

export function resolveSeo(pathname?: string): SeoConfig {
  const path = pathname?.split("?")[0] || "/";

  if (ROUTE_SEO[path]) return ROUTE_SEO[path];

  for (const route of DYNAMIC_ROUTES) {
    const match = path.match(route.pattern);
    if (!match) continue;
    const template = DYNAMIC_SEO[route.key];
    if (!template) break;
    return applyTemplate(template, { [route.param]: match[1] });
  }

  return DEFAULT_SEO;
}
