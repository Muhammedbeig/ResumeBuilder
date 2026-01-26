import type { ResumeData } from "@/types";

export const previewResumeData: ResumeData = {
  basics: {
    name: "Ava Thompson",
    title: "Senior Product Designer",
    location: "San Francisco, CA",
    email: "ava.thompson@email.com",
    phone: "+1 (555) 010-1122",
    summary:
      "Product designer with 7+ years of experience crafting human-centered SaaS and mobile experiences. Led cross-functional teams to ship features that increased activation by 28% and reduced churn by 15%.",
    linkedin: "linkedin.com/in/ava-thompson",
    github: "github.com/avathompson",
  },
  experiences: [
    {
      id: "exp-1",
      company: "Nimbus Labs",
      role: "Senior Product Designer",
      location: "San Francisco, CA",
      startDate: "2021",
      endDate: "",
      current: true,
      bullets: [
        "Redesigned onboarding flow, lifting activation by 28% through simplified steps and progressive disclosure.",
        "Partnered with PM and engineering to deliver a new analytics dashboard used by 20K+ customers.",
      ],
    },
    {
      id: "exp-2",
      company: "PixelMint",
      role: "Product Designer",
      location: "Remote",
      startDate: "2018",
      endDate: "2021",
      current: false,
      bullets: [
        "Built design system that reduced UI build time by 35% across 6 product squads.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of Washington",
      degree: "B.A.",
      field: "Visual Communication Design",
      startDate: "2014",
      endDate: "2018",
      gpa: "3.8",
    },
  ],
  skills: [
    {
      id: "skills-1",
      name: "Design",
      skills: ["Figma", "Design Systems", "Prototyping", "UX Research"],
    },
    {
      id: "skills-2",
      name: "Collaboration",
      skills: ["Workshop Facilitation", "Stakeholder Alignment", "Product Strategy"],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "InsightOps Analytics",
      description:
        "End-to-end redesign of enterprise analytics with modular widgets and custom alerts.",
      technologies: ["Figma", "Amplitude"],
      link: "https://insightops.example.com",
      github: "",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "Google UX Design Certificate",
      issuer: "Google",
      date: "2020",
      link: "",
    },
  ],
  languages: [],
};

export const placeholderResumeData: ResumeData = {
  basics: {
    name: "Your Name",
    title: "Professional Title",
    location: "City, State",
    email: "you@email.com",
    phone: "+1 (555) 000-0000",
    summary:
      "Add a 2-3 sentence summary highlighting your strengths, experience, and the roles you’re targeting.",
    linkedin: "linkedin.com/in/yourname",
    github: "github.com/yourname",
  },
  experiences: [
    {
      id: "exp-1",
      company: "Company Name",
      role: "Job Title",
      location: "City, State",
      startDate: "2022",
      endDate: "Present",
      current: true,
      bullets: [
        "Start with a strong action verb and describe a measurable impact.",
        "Highlight a project, tool, or process you led and its results.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University Name",
      degree: "Degree",
      field: "Field of Study",
      startDate: "2018",
      endDate: "2022",
      gpa: "",
    },
  ],
  skills: [
    {
      id: "skills-1",
      name: "Core Skills",
      skills: ["Skill One", "Skill Two", "Skill Three"],
    },
    {
      id: "skills-2",
      name: "Tools",
      skills: ["Tool One", "Tool Two", "Tool Three"],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Project Name",
      description: "Describe the project, your role, and the impact or outcome.",
      technologies: ["Tech One", "Tech Two"],
      link: "",
      github: "",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "Certification Name",
      issuer: "Issuing Organization",
      date: "2023",
      link: "",
    },
  ],
  languages: [],
};
