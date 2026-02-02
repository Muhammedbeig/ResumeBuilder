export type BlogCategory = {
  slug: string;
  title: string;
  description: string;
  highlights: string[];
};

export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: {
    name: string;
    role: string;
  };
  tags: string[];
  takeaways: string[];
  sections: BlogSection[];
  featured?: boolean;
};

export const careerBlogCategories: BlogCategory[] = [
  {
    slug: "career-advice",
    title: "Career Advice",
    description: "Practical guidance for resumes, interviews, and confident job search decisions.",
    highlights: ["Resume strategy", "Interview prep", "Negotiation"],
  },
  {
    slug: "career-paths",
    title: "Career Paths",
    description: "Explore new directions, map growth paths, and plan smart transitions.",
    highlights: ["Career pivots", "Growth planning", "Market research"],
  },
  {
    slug: "career-services",
    title: "Career Services",
    description: "Systemize your search with repeatable workflows, tools, and checklists.",
    highlights: ["Search systems", "Networking", "Tracking"],
  },
  {
    slug: "internships",
    title: "Internships",
    description: "Land, thrive in, and convert internships into full time offers.",
    highlights: ["Applications", "Conversions", "Early career"],
  },
  {
    slug: "professional-development",
    title: "Professional Development",
    description: "Strengthen core skills, leadership habits, and long term career growth.",
    highlights: ["Skill building", "Leadership", "Remote work"],
  },
];

export const careerBlogPosts: BlogPost[] = [
  {
    slug: "ats-friendly-resume-structure",
    title: "ATS friendly resume structure that still feels human",
    excerpt:
      "Learn a clean layout, smart section order, and keyword strategy that ATS systems can scan without losing your voice.",
    category: "career-advice",
    date: "Jan 30, 2026",
    readTime: "6 min read",
    author: { name: "Ayesha Khan", role: "Resume Strategist" },
    tags: ["Resume", "ATS", "Formatting"],
    takeaways: [
      "Keep layout simple and consistent",
      "Match keywords to the role",
      "Lead with outcomes, not tasks",
    ],
    sections: [
      {
        heading: "Start with a clear, scannable header",
        paragraphs: [
          "Place your name, title, and contact details at the top in plain text so ATS scanners can read them without issues.",
          "Use a single column layout and avoid tables. A simple structure helps both software and humans find what matters fast.",
        ],
        bullets: [
          "Use one professional headline aligned with the role",
          "List phone, email, city, and LinkedIn in one line",
          "Avoid icons or graphics in the header",
        ],
      },
      {
        heading: "Shape bullets around outcomes",
        paragraphs: [
          "ATS systems look for keywords, but recruiters look for impact. Combine both by leading each bullet with an action verb and a measurable result.",
          "If you do not have hard metrics, use scope or quality signals like timelines, budget size, or customer impact.",
        ],
        bullets: [
          "Action verb + outcome + context",
          "Add metrics like time saved, growth, or quality gains",
          "Keep bullets to one or two lines",
        ],
      },
      {
        heading: "Run a quick ATS sanity check",
        paragraphs: [
          "Scan the job description and reflect core skills in your summary, skills list, and most recent role. Do not copy blindly, map your experience to their language.",
          "Save a clean PDF and a DOCX copy. Some systems prefer DOCX and may misread complex PDF layouts.",
        ],
        bullets: [
          "Use standard section headings like Experience and Skills",
          "Avoid text boxes, columns, or heavy design elements",
          "Proofread for consistency in dates and titles",
        ],
      },
    ],
    featured: true,
  },
  {
    slug: "interview-prep-7-day-plan",
    title: "Interview prep plan: 7 days to confident answers",
    excerpt:
      "A focused one week plan that balances company research, story building, and realistic practice.",
    category: "career-advice",
    date: "Jan 18, 2026",
    readTime: "7 min read",
    author: { name: "Marcus Lee", role: "Career Coach" },
    tags: ["Interview", "Preparation", "Behavioral"],
    takeaways: [
      "Turn your experience into clear stories",
      "Practice out loud, not in your head",
      "Close with thoughtful questions",
    ],
    sections: [
      {
        heading: "Day 1 to 2: build your story bank",
        paragraphs: [
          "Draft five to seven stories that cover leadership, conflict, learning, and impact. Use a simple structure so you can retell them clearly under pressure.",
          "Match each story to a common question. This keeps you from rambling and keeps answers focused.",
        ],
        bullets: [
          "Situation, action, result",
          "Highlight the role you played",
          "Keep each story under two minutes",
        ],
      },
      {
        heading: "Day 3 to 5: role research and skills proof",
        paragraphs: [
          "Study the job description and the company web site. Identify the top three skills and prepare concrete examples for each.",
          "If the role is technical, build a small proof of work or a short demo. This can set you apart in follow up emails.",
        ],
        bullets: [
          "Map skills to projects you completed",
          "Prepare one example for each key requirement",
          "Gather artifacts like dashboards or slides",
        ],
      },
      {
        heading: "Day 6 to 7: practice and polish",
        paragraphs: [
          "Rehearse with a friend or record yourself. Focus on clarity, pacing, and using specific outcomes.",
          "Prepare questions that show research and curiosity. End with a short summary of why you are a fit.",
        ],
        bullets: [
          "Answer in 60 to 120 seconds",
          "Use simple language over jargon",
          "Bring two to three thoughtful questions",
        ],
      },
    ],
    featured: true,
  },
  {
    slug: "salary-negotiation-checklist",
    title: "Salary negotiation checklist for a confident conversation",
    excerpt:
      "A practical checklist to research ranges, set anchors, and negotiate without burning bridges.",
    category: "career-advice",
    date: "Jan 10, 2026",
    readTime: "6 min read",
    author: { name: "Priya Patel", role: "Hiring Advisor" },
    tags: ["Negotiation", "Offer", "Compensation"],
    takeaways: [
      "Lead with market data",
      "Negotiate the full package",
      "Keep the tone collaborative",
    ],
    sections: [
      {
        heading: "Research and set your range",
        paragraphs: [
          "Before you discuss numbers, gather salary data from reliable market sources and peers. Build a range based on role scope, location, and seniority.",
          "Write down your walk away number and your target. This reduces hesitation during the live conversation.",
        ],
        bullets: [
          "Use multiple sources to validate ranges",
          "Account for location and remote policies",
          "Define target and minimum values",
        ],
      },
      {
        heading: "Anchor with value, not emotion",
        paragraphs: [
          "Start with a summary of impact you will deliver. Then present the range you researched and ask how it aligns with their budget.",
          "Use calm, professional language. Avoid apologies or overly aggressive tone.",
        ],
        bullets: [
          "Lead with expected outcomes",
          "Share your range and ask for alignment",
          "Pause and listen before responding",
        ],
      },
      {
        heading: "Negotiate the full package",
        paragraphs: [
          "If base salary is fixed, explore bonus, equity, learning budget, or flexible schedule. Many companies have room in non salary items.",
          "Always confirm the final offer in writing with dates and benefits.",
        ],
        bullets: [
          "Consider bonuses, equity, and benefits",
          "Ask about review cycles and growth paths",
          "Confirm everything in writing",
        ],
      },
    ],
  },
  {
    slug: "ai-in-job-search",
    title: "Using AI in your job search without losing authenticity",
    excerpt:
      "AI can speed up drafts, but you still need ownership. Learn a workflow that stays true to your experience.",
    category: "career-advice",
    date: "Dec 28, 2025",
    readTime: "5 min read",
    author: { name: "Omar Siddiqui", role: "Product Lead" },
    tags: ["AI", "Job Search", "Ethics"],
    takeaways: [
      "Use AI for structure, not facts",
      "Always verify final wording",
      "Keep your unique voice",
    ],
    sections: [
      {
        heading: "Use AI for structure and brainstorming",
        paragraphs: [
          "Start by outlining the job requirements and your relevant projects. AI can help you organize and find clear language fast.",
          "Treat AI output as a draft. Replace generic phrases with specific achievements and details.",
        ],
        bullets: [
          "Summarize role requirements",
          "Draft bullet options quickly",
          "Rewrite in your own voice",
        ],
      },
      {
        heading: "Keep claims accurate and provable",
        paragraphs: [
          "Do not add skills you cannot defend. If AI suggests a technology you did not use, remove it.",
          "Save a short proof list for each claim, such as links, metrics, or project notes.",
        ],
        bullets: [
          "Avoid inflated titles or metrics",
          "Add evidence for every strong claim",
          "Stay consistent across resume and LinkedIn",
        ],
      },
      {
        heading: "Communicate transparency in interviews",
        paragraphs: [
          "If asked about AI, explain that you used it to refine structure but that the experience is yours. Most hiring teams value clarity and honesty.",
          "Your goal is to demonstrate ownership of the work you describe, not to hide behind tools.",
        ],
        bullets: [
          "Be ready to explain your process",
          "Share what you learned and built",
          "Focus on outcomes and decisions",
        ],
      },
    ],
  },
  {
    slug: "switching-careers-without-starting-over",
    title: "Switching careers without starting over",
    excerpt:
      "A step by step approach to map transferable skills and move into a new industry with confidence.",
    category: "career-paths",
    date: "Dec 20, 2025",
    readTime: "7 min read",
    author: { name: "Hira Noor", role: "Career Strategist" },
    tags: ["Career Change", "Transferable Skills"],
    takeaways: [
      "Inventory skills and outcomes",
      "Target adjacent roles first",
      "Build proof with small projects",
    ],
    sections: [
      {
        heading: "Inventory transferable skills",
        paragraphs: [
          "List the skills you use every week and map them to business outcomes. Most roles share core competencies like analysis, coordination, or customer focus.",
          "Group skills into themes so you can see which industries value them most.",
        ],
        bullets: [
          "Document tools, processes, and outcomes",
          "Highlight industry neutral capabilities",
          "Translate jargon into common language",
        ],
      },
      {
        heading: "Target adjacent roles",
        paragraphs: [
          "Look for roles that share 60 to 70 percent of your skills. This lowers the barrier and helps you build credibility fast.",
          "Use job descriptions to spot common requirements and build a shortlist of realistic targets.",
        ],
        bullets: [
          "Prioritize roles with overlapping skills",
          "Talk to people already in the field",
          "Pick two or three target titles",
        ],
      },
      {
        heading: "Build proof before you apply",
        paragraphs: [
          "Small projects, certifications, or volunteer work can demonstrate commitment. Choose proof that mirrors the job tasks.",
          "Show the learning process and the impact, not just the credential.",
        ],
        bullets: [
          "Create a portfolio or case study",
          "Document the results and lessons",
          "Update your resume to highlight the pivot",
        ],
      },
    ],
    featured: true,
  },
  {
    slug: "data-driven-career-decisions",
    title: "Data driven career decisions: how to read labor market signals",
    excerpt:
      "Use public labor market data to validate demand, salary ranges, and future skill trends before you make a move.",
    category: "career-paths",
    date: "Dec 12, 2025",
    readTime: "8 min read",
    author: { name: "Jacob Reed", role: "Market Analyst" },
    tags: ["Labor Market", "Planning", "Research"],
    takeaways: [
      "Use public sources to validate demand",
      "Focus on skills that repeat across postings",
      "Plan a learning path with clear milestones",
    ],
    sections: [
      {
        heading: "Start with job outlook and demand",
        paragraphs: [
          "Check public labor market resources to see projected growth, common duties, and typical education requirements.",
          "This helps you avoid chasing a path with limited demand or unclear progression.",
        ],
        bullets: [
          "Review role outlook and related occupations",
          "Compare regional demand",
          "Note typical entry requirements",
        ],
      },
      {
        heading: "Translate signals into skill priorities",
        paragraphs: [
          "Collect job postings and identify skill clusters that appear most often. These are the skills to highlight and develop first.",
          "Match those skills to your current strengths and plan the gaps you need to close.",
        ],
        bullets: [
          "Group skills into core and bonus lists",
          "Validate with multiple employers",
          "Build a learning plan around gaps",
        ],
      },
      {
        heading: "Turn research into a personal roadmap",
        paragraphs: [
          "Set a short term plan for new skills and a longer term plan for portfolio proof. Progress is easier when you track it weekly.",
          "Use the data to shape your resume summary and the projects you choose to build.",
        ],
        bullets: [
          "Break goals into 30 and 90 day targets",
          "Create a simple tracker",
          "Update your resume with aligned keywords",
        ],
      },
    ],
  },
  {
    slug: "portfolio-that-proves-skill",
    title: "Build a portfolio that proves your skills",
    excerpt:
      "A clear portfolio beats a long resume. Learn what to include, how to write case studies, and how to show impact.",
    category: "career-paths",
    date: "Dec 2, 2025",
    readTime: "6 min read",
    author: { name: "Sara Ahmed", role: "Portfolio Coach" },
    tags: ["Portfolio", "Proof of Work"],
    takeaways: [
      "Show outcomes and decisions",
      "Keep projects focused",
      "Explain your role clearly",
    ],
    sections: [
      {
        heading: "Pick focused projects",
        paragraphs: [
          "Choose three to five projects that reflect the role you want next. Each project should tell a clear story about problem, approach, and result.",
          "Avoid dumping every project you have. Depth beats breadth.",
        ],
        bullets: [
          "Align projects with target role",
          "Highlight decisions you made",
          "Show measurable results",
        ],
      },
      {
        heading: "Write short, scannable case studies",
        paragraphs: [
          "Use a simple structure so reviewers can scan quickly. Lead with the outcome and then explain how you got there.",
          "Include constraints, tools, and the impact on users or the business.",
        ],
        bullets: [
          "Problem, approach, outcome",
          "Keep sections under 120 words",
          "Add links or visuals where possible",
        ],
      },
      {
        heading: "Make it easy to navigate",
        paragraphs: [
          "Organize your portfolio with clear labels and a short summary. The goal is to reduce friction for reviewers.",
          "Add a one sentence summary at the top of each project.",
        ],
        bullets: [
          "Use a clean layout and simple menus",
          "Add a short project summary",
          "Link to live demos when possible",
        ],
      },
    ],
  },
  {
    slug: "career-services-checklist-for-grads",
    title: "Career services checklist for new graduates",
    excerpt:
      "A simple checklist that turns career services advice into real progress each week.",
    category: "career-services",
    date: "Nov 22, 2025",
    readTime: "5 min read",
    author: { name: "Liam Jordan", role: "University Liaison" },
    tags: ["Graduates", "Checklist"],
    takeaways: [
      "Build one core resume",
      "Track applications weekly",
      "Collect feedback and iterate",
    ],
    sections: [
      {
        heading: "Prepare core materials",
        paragraphs: [
          "Create one strong resume and a base cover letter. Use them as templates so you can tailor faster.",
          "Store references and transcripts in one place for quick access.",
        ],
        bullets: [
          "One resume master copy",
          "One cover letter template",
          "Central folder for transcripts and references",
        ],
      },
      {
        heading: "Build a weekly routine",
        paragraphs: [
          "Set goals for applications, networking messages, and learning. Consistency beats short bursts of effort.",
          "Use a tracker so you always know where each application stands.",
        ],
        bullets: [
          "Target 5 to 10 tailored applications",
          "Send 3 to 5 networking notes",
          "Review progress every Friday",
        ],
      },
      {
        heading: "Capture feedback and improve",
        paragraphs: [
          "Track rejections and patterns. Update your resume or approach based on consistent feedback.",
          "Schedule mock interviews to keep sharpening your answers.",
        ],
        bullets: [
          "Document common feedback",
          "Update skills every month",
          "Practice one interview each week",
        ],
      },
    ],
  },
  {
    slug: "networking-system-that-works",
    title: "A networking system that fits into a busy week",
    excerpt:
      "Build a simple networking loop that feels natural and gets you warm introductions.",
    category: "career-services",
    date: "Nov 12, 2025",
    readTime: "6 min read",
    author: { name: "Nadia Hussain", role: "Community Builder" },
    tags: ["Networking", "Outreach"],
    takeaways: [
      "Make outreach easy to repeat",
      "Focus on helping first",
      "Follow up consistently",
    ],
    sections: [
      {
        heading: "Create a simple outreach list",
        paragraphs: [
          "Start with past colleagues, alumni, and friends. Build a small list of 20 to 30 people you can reach out to.",
          "Aim for quality over quantity. A short thoughtful message beats a mass blast.",
        ],
        bullets: [
          "List warm connections first",
          "Group by industry or role",
          "Set a weekly outreach target",
        ],
      },
      {
        heading: "Lead with value",
        paragraphs: [
          "Ask about their work and offer something useful. This could be an article, a referral, or a quick insight.",
          "Avoid asking for a job right away. Build trust first.",
        ],
        bullets: [
          "Use a short, friendly opening",
          "Offer a relevant resource",
          "Ask for 15 minutes, not 60",
        ],
      },
      {
        heading: "Follow up with a rhythm",
        paragraphs: [
          "Keep a simple tracker of who you contacted and when. Follow up after one week if there is no reply.",
          "Consistency turns a small network into a strong one over time.",
        ],
        bullets: [
          "Use a basic spreadsheet or tool",
          "Follow up once with a gentle reminder",
          "Thank people who respond",
        ],
      },
    ],
  },
  {
    slug: "job-search-tracker",
    title: "Build a job search tracker you will actually use",
    excerpt:
      "A lightweight tracker helps you avoid duplicate applications and keeps momentum high.",
    category: "career-services",
    date: "Oct 30, 2025",
    readTime: "5 min read",
    author: { name: "Ravi Menon", role: "Operations Analyst" },
    tags: ["Organization", "Productivity"],
    takeaways: [
      "Track status and next steps",
      "Review weekly to stay on pace",
      "Measure what works",
    ],
    sections: [
      {
        heading: "Start with the simplest fields",
        paragraphs: [
          "A tracker should be easy to maintain. Begin with company, role, date applied, status, and next step.",
          "Add a notes column to capture feedback or interview insights.",
        ],
        bullets: [
          "Company and role title",
          "Date applied and status",
          "Next action and due date",
        ],
      },
      {
        heading: "Create a weekly review ritual",
        paragraphs: [
          "Set a weekly time to review all applications and plan next steps. This keeps you from losing momentum.",
          "Look for patterns in responses and adjust your strategy accordingly.",
        ],
        bullets: [
          "Review every Friday",
          "Mark stalled applications",
          "Plan next week targets",
        ],
      },
      {
        heading: "Use the data to improve",
        paragraphs: [
          "Track which resume versions or outreach methods lead to interviews. Double down on what works.",
          "If one industry responds better, focus efforts there.",
        ],
        bullets: [
          "Track response rates",
          "Compare versions of your resume",
          "Refine your target list",
        ],
      },
    ],
  },
  {
    slug: "internship-to-offer",
    title: "From internship to offer: a conversion plan",
    excerpt:
      "Turn a short internship into a full time offer with intentional visibility and measurable impact.",
    category: "internships",
    date: "Oct 18, 2025",
    readTime: "6 min read",
    author: { name: "Hassan Ali", role: "Early Career Mentor" },
    tags: ["Internships", "Early Career"],
    takeaways: [
      "Clarify goals early",
      "Share progress often",
      "Document impact",
    ],
    sections: [
      {
        heading: "Set expectations in week one",
        paragraphs: [
          "Ask what success looks like and how impact will be measured. Get clarity on priorities and deliverables.",
          "Agree on a weekly check in so your manager knows your progress.",
        ],
        bullets: [
          "Define success metrics",
          "Schedule weekly updates",
          "Clarify ownership and scope",
        ],
      },
      {
        heading: "Create visible wins",
        paragraphs: [
          "Pick tasks that have clear outcomes and will be used by others. Small wins can add up quickly.",
          "Share updates through the channels the team uses, like standups or project notes.",
        ],
        bullets: [
          "Deliver work with measurable impact",
          "Communicate progress weekly",
          "Ask for feedback regularly",
        ],
      },
      {
        heading: "Close with a summary of results",
        paragraphs: [
          "At the end of the internship, present a short summary of what you delivered, what you learned, and how you can contribute long term.",
          "This makes it easier for managers to advocate for a return offer.",
        ],
        bullets: [
          "Summarize key outcomes",
          "Show how you improved over time",
          "Ask about next steps early",
        ],
      },
    ],
  },
  {
    slug: "internship-application-playbook",
    title: "Internship applications that stand out",
    excerpt:
      "Learn how to write concise bullets, tailor your resume, and use small projects to get noticed.",
    category: "internships",
    date: "Oct 6, 2025",
    readTime: "5 min read",
    author: { name: "Zara Malik", role: "Campus Recruiter" },
    tags: ["Internships", "Applications"],
    takeaways: [
      "Tailor for each role",
      "Highlight projects, not coursework",
      "Follow up professionally",
    ],
    sections: [
      {
        heading: "Tailor for the role",
        paragraphs: [
          "Even small changes to your resume can improve results. Use the exact role title and reflect the key skills requested.",
          "Focus on the top two skills and show where you used them.",
        ],
        bullets: [
          "Match skills from the job post",
          "Update your summary for each role",
          "Keep it to one page",
        ],
      },
      {
        heading: "Turn projects into impact",
        paragraphs: [
          "Pick class or personal projects that demonstrate real outcomes. Focus on what you built and why it mattered.",
          "Add links to demos or repositories when possible.",
        ],
        bullets: [
          "Explain the problem and result",
          "Use numbers when available",
          "Keep descriptions concise",
        ],
      },
      {
        heading: "Follow up with clarity",
        paragraphs: [
          "Send a short follow up email after applying or after events. This keeps you visible and professional.",
          "Ask for feedback if you get rejected and use it to improve.",
        ],
        bullets: [
          "Send a polite follow up",
          "Be specific about your interest",
          "Thank people for their time",
        ],
      },
    ],
  },
  {
    slug: "remote-work-success-playbook",
    title: "Remote work success playbook",
    excerpt:
      "Build strong communication habits, manage visibility, and deliver impact in remote or hybrid teams.",
    category: "professional-development",
    date: "Sep 22, 2025",
    readTime: "7 min read",
    author: { name: "Maya Chen", role: "Remote Team Lead" },
    tags: ["Remote Work", "Collaboration"],
    takeaways: [
      "Over communicate the right way",
      "Document work and decisions",
      "Protect focus time",
    ],
    sections: [
      {
        heading: "Communicate in a predictable rhythm",
        paragraphs: [
          "Remote teams work best when updates are visible. Share weekly priorities and status in shared channels.",
          "Use short written updates so others can catch up asynchronously.",
        ],
        bullets: [
          "Weekly priorities and status updates",
          "Daily check ins when needed",
          "Clear handoffs and owners",
        ],
      },
      {
        heading: "Make your work visible",
        paragraphs: [
          "Capture decisions and outcomes in shared documents. This helps others understand progress without meetings.",
          "Use demos, screenshots, or short Loom style videos to explain results.",
        ],
        bullets: [
          "Document decisions and rationale",
          "Share deliverables in one place",
          "Keep status easy to find",
        ],
      },
      {
        heading: "Protect focus time",
        paragraphs: [
          "Block time for deep work. Set expectations so people know when you are heads down.",
          "Quality output and consistent communication create trust in remote teams.",
        ],
        bullets: [
          "Set focus blocks on your calendar",
          "Batch meetings on specific days",
          "Turn async updates into habit",
        ],
      },
    ],
  },
  {
    slug: "learning-roadmap-12-months",
    title: "Create a 12 month learning roadmap",
    excerpt:
      "A simple plan to build skills with momentum, avoid burnout, and prove progress.",
    category: "professional-development",
    date: "Sep 8, 2025",
    readTime: "6 min read",
    author: { name: "Diego Alvarez", role: "Learning Designer" },
    tags: ["Learning", "Upskilling"],
    takeaways: [
      "Pick one core skill at a time",
      "Schedule practice blocks",
      "Show proof of progress",
    ],
    sections: [
      {
        heading: "Choose one core skill",
        paragraphs: [
          "Focus on the skill that most impacts your next role. One major skill plus one supporting skill is enough for one quarter.",
          "Too many goals at once leads to shallow progress.",
        ],
        bullets: [
          "Pick a primary skill for each quarter",
          "Add a supporting skill for context",
          "Review priorities every 90 days",
        ],
      },
      {
        heading: "Build a simple weekly rhythm",
        paragraphs: [
          "Set time blocks for learning and practice. Small consistent sessions beat rare long sessions.",
          "Track what you learned and how you applied it.",
        ],
        bullets: [
          "Two to three sessions per week",
          "Use a learning log",
          "Apply learning in a small project",
        ],
      },
      {
        heading: "Show proof of progress",
        paragraphs: [
          "Create a portfolio item, write a case study, or present a short demo. Proof builds confidence and makes interviews easier.",
          "Use public artifacts when possible so hiring teams can validate your work.",
        ],
        bullets: [
          "Publish short case studies",
          "Ship small projects",
          "Highlight results on your resume",
        ],
      },
    ],
  },
  {
    slug: "first-time-manager-toolkit",
    title: "First time manager toolkit",
    excerpt:
      "A practical guide to set expectations, coach effectively, and lead with clarity in your first 90 days.",
    category: "professional-development",
    date: "Aug 25, 2025",
    readTime: "7 min read",
    author: { name: "Elena Rossi", role: "Leadership Coach" },
    tags: ["Leadership", "Management"],
    takeaways: [
      "Clarify expectations early",
      "Give feedback with context",
      "Build trust through consistency",
    ],
    sections: [
      {
        heading: "Set team expectations",
        paragraphs: [
          "Clarify goals, priorities, and ways of working within the first two weeks. Misalignment early causes long term friction.",
          "Document the team mission and success metrics so everyone shares a clear direction.",
        ],
        bullets: [
          "Define what success looks like",
          "Agree on communication norms",
          "Create a simple team charter",
        ],
      },
      {
        heading: "Coach, do not rescue",
        paragraphs: [
          "Give feedback that is timely and specific. Ask questions that help people find their own solution.",
          "This builds ownership and confidence across the team.",
        ],
        bullets: [
          "Use clear examples and outcomes",
          "Balance praise with coaching",
          "Track growth goals in one place",
        ],
      },
      {
        heading: "Build a culture of trust",
        paragraphs: [
          "Consistency is what builds trust. Keep your commitments and follow through on decisions.",
          "Hold regular one on ones and remove blockers quickly.",
        ],
        bullets: [
          "Schedule one on ones weekly",
          "Remove blockers fast",
          "Be transparent about decisions",
        ],
      },
    ],
  },
  {
    slug: "cross-functional-collaboration",
    title: "Cross functional collaboration without chaos",
    excerpt:
      "Align goals, clarify ownership, and move projects forward when multiple teams are involved.",
    category: "professional-development",
    date: "Aug 12, 2025",
    readTime: "6 min read",
    author: { name: "Amir Qureshi", role: "Program Manager" },
    tags: ["Collaboration", "Communication"],
    takeaways: [
      "Define ownership clearly",
      "Align on shared outcomes",
      "Use simple project rituals",
    ],
    sections: [
      {
        heading: "Clarify ownership from day one",
        paragraphs: [
          "Use a clear owner for each deliverable. Ambiguity slows progress and creates duplicated work.",
          "Write down who decides, who contributes, and who reviews.",
        ],
        bullets: [
          "Assign a single owner per deliverable",
          "Document responsibilities",
          "Set decision makers early",
        ],
      },
      {
        heading: "Align on outcomes, not tasks",
        paragraphs: [
          "Teams collaborate best when everyone agrees on the outcome and why it matters. This makes tradeoffs easier.",
          "Keep a short project brief so everyone can reference the same goal.",
        ],
        bullets: [
          "Define the end result clearly",
          "Keep a short project brief",
          "Review goals in each check in",
        ],
      },
      {
        heading: "Use light weight rituals",
        paragraphs: [
          "Short weekly updates and a shared tracker can reduce meetings. Use simple rituals that keep work visible.",
          "Celebrate small wins to keep energy high across teams.",
        ],
        bullets: [
          "Weekly status updates",
          "Shared task tracker",
          "End of sprint recap",
        ],
      },
    ],
  },
];

export const featuredCareerBlogPosts = careerBlogPosts.filter((post) => post.featured);

export const getCareerBlogCategory = (slug: string) =>
  careerBlogCategories.find((category) => category.slug === slug);

export const getCareerBlogPost = (slug: string) =>
  careerBlogPosts.find((post) => post.slug === slug);

export const getCareerBlogPostsByCategory = (slug: string) =>
  careerBlogPosts.filter((post) => post.category === slug);
