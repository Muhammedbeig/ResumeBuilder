import { Resume } from "./resume-schema";

export const MOCK_RESUME: Resume = {
  id: "mock-resume-001",
  metadata: {
    templateId: "modern",
    themeColor: "#2563eb", // blue-600
    fontFamily: "inter",
    paperSize: "a4",
  },
  data: {
    basics: {
      name: "Alex Johnson",
      title: "Senior Full Stack Engineer",
      email: "alex.johnson@example.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      linkedin: "https://linkedin.com/in/alexjohnson",
      github: "https://github.com/alexjohnson",
      portfolio: "https://alexjohnson.dev",
      summary: "Experienced Full Stack Engineer with over 6 years of experience in building scalable web applications. Proficient in React, Node.js, and Cloud technologies. Passionate about clean code, performance optimization, and developer experience.",
    },
    experiences: [
      {
        id: "exp-1",
        company: "TechNova Solutions",
        role: "Senior Software Engineer",
        location: "San Francisco, CA",
        startDate: "2021-03",
        endDate: "Present",
        current: true,
        bullets: [
          "Led the migration of a legacy monolithic application to a microservices architecture, improving system scalability by 40%.",
          "Implemented a CI/CD pipeline using GitHub Actions, reducing deployment time from 1 hour to 15 minutes.",
          "Mentored 3 junior developers, conducting code reviews and technical workshops.",
        ],
      },
      {
        id: "exp-2",
        company: "Creative Web Agency",
        role: "Full Stack Developer",
        location: "Austin, TX",
        startDate: "2018-06",
        endDate: "2021-02",
        current: false,
        bullets: [
          "Developed high-fidelity user interfaces for e-commerce clients using React and Redux.",
          "Optimized database queries for a high-traffic retail platform, reducing page load times by 2 seconds.",
          "Collaborated with designers and product managers to deliver features on time and within scope.",
        ],
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "University of Texas at Austin",
        degree: "Bachelor of Science",
        field: "Computer Science",
        startDate: "2014-09",
        endDate: "2018-05",
        gpa: "3.8",
      },
    ],
    skills: [
      {
        id: "skill-1",
        name: "Frontend",
        skills: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
      },
      {
        id: "skill-2",
        name: "Backend",
        skills: ["Node.js", "Express", "PostgreSQL", "Redis"],
      },
      {
        id: "skill-3",
        name: "DevOps",
        skills: ["Docker", "AWS", "GitHub Actions", "Terraform"],
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: "E-Commerce Dashboard",
        description: "A comprehensive analytics dashboard for online retailers.",
        technologies: ["React", "D3.js", "Node.js"],
        link: "https://demo.dashboard.com",
        github: "https://github.com/alexjohnson/dashboard",
      },
      {
        id: "proj-2",
        name: "Task Master",
        description: "A collaborative project management tool with real-time updates.",
        technologies: ["Vue.js", "Firebase", "Tailwind CSS"],
        github: "https://github.com/alexjohnson/taskmaster",
      },
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Certified Solutions Architect",
        issuer: "Amazon Web Services",
        date: "2023-01",
      },
    ],
    languages: [
      {
        id: "lang-1",
        name: "English",
        proficiency: "Native",
      },
      {
        id: "lang-2",
        name: "Spanish",
        proficiency: "Intermediate",
      },
    ],
  },
};
