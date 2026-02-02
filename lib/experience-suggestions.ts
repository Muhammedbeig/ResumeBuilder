type KeywordBucket = {
  keywords: string[];
  bullets: string[];
};

const uniqueList = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trim();
    if (!key || seen.has(key.toLowerCase())) return false;
    seen.add(key.toLowerCase());
    return true;
  });
};

export const JOB_TITLE_SUGGESTIONS = uniqueList([
  "Software Engineer",
  "Senior Software Engineer",
  "Frontend Developer",
  "Back End Developer",
  "Front End Engineer",
  "Back End Engineer",
  "Full Stack Developer",
  "Full Stack Engineer",
  "Web Developer",
  "Mobile App Developer",
  "Android Developer",
  "iOS Developer",
  "React Developer",
  "Node.js Developer",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Cloud Engineer",
  "Cloud Architect",
  "Security Engineer",
  "Cybersecurity Analyst",
  "Information Security Analyst",
  "QA Engineer",
  "QA Automation Engineer",
  "Test Engineer",
  "System Administrator",
  "Network Engineer",
  "Database Administrator",
  "Solution Architect",
  "Data Scientist",
  "Data Analyst",
  "Data Engineer",
  "Machine Learning Engineer",
  "AI Engineer",
  "Business Analyst",
  "Business Intelligence Analyst",
  "Product Manager",
  "Product Owner",
  "Product Designer",
  "Project Manager",
  "Project Coordinator",
  "Program Manager",
  "Scrum Master",
  "UI Designer",
  "UX Designer",
  "UI/UX Designer",
  "UX Researcher",
  "Graphic Designer",
  "Motion Designer",
  "Content Designer",
  "Digital Marketing Specialist",
  "Marketing Manager",
  "Brand Manager",
  "Growth Manager",
  "SEO Specialist",
  "Social Media Manager",
  "Content Writer",
  "Copywriter",
  "Technical Writer",
  "Public Relations Officer",
  "Media Planner",
  "Sales Executive",
  "Sales Manager",
  "Sales Operations Manager",
  "Account Manager",
  "Key Account Manager",
  "Business Development Manager",
  "Customer Success Manager",
  "Customer Support Representative",
  "Customer Service Representative",
  "Customer Relations Officer",
  "Call Center Agent",
  "HR Generalist",
  "HR Manager",
  "Talent Acquisition Specialist",
  "Recruiter",
  "Office Manager",
  "Administrative Assistant",
  "Executive Assistant",
  "Operations Manager",
  "Operations Analyst",
  "Supply Chain Manager",
  "Procurement Officer",
  "Logistics Coordinator",
  "Warehouse Supervisor",
  "Retail Manager",
  "Store Manager",
  "Merchandiser",
  "Finance Manager",
  "Accountant",
  "Financial Analyst",
  "Audit Associate",
  "Tax Analyst",
  "Risk Analyst",
  "Compliance Officer",
  "Legal Counsel",
  "Corporate Lawyer",
  "Paralegal",
  "Consultant",
  "Management Consultant",
  "Strategy Analyst",
  "Research Analyst",
  "Research Assistant",
  "Economist",
  "Statistician",
  "Teacher",
  "Lecturer",
  "Trainer",
  "Instructional Designer",
  "Nurse",
  "Medical Officer",
  "Pharmacist",
  "Lab Technician",
  "Civil Engineer",
  "Electrical Engineer",
  "Mechanical Engineer",
  "Chemical Engineer",
  "Industrial Engineer",
  "Quality Assurance Manager",
  "Production Manager",
  "Plant Manager",
  "HSE Officer",
  "Security Officer",
  "IT Support Specialist",
  "CRM Specialist",
  "ERP Consultant",
  "SAP Consultant",
  "Salesforce Administrator",
  "Oracle Developer",
  "Video Editor",
  "Photographer",
  "Journalist",
  "Event Manager",
  "Receptionist",
  "Data Entry Operator",
]);

export const PAKISTANI_COMPANIES = uniqueList([
  "Habib Bank Limited (HBL)",
  "United Bank Limited (UBL)",
  "MCB Bank",
  "National Bank of Pakistan",
  "Allied Bank",
  "Bank Alfalah",
  "Meezan Bank",
  "Askari Bank",
  "Faysal Bank",
  "Bank of Punjab",
  "JS Bank",
  "Standard Chartered Pakistan",
  "Citibank Pakistan",
  "Mobilink Bank",
  "Easypaisa",
  "State Bank of Pakistan",
  "Pakistan Stock Exchange",
  "Jazz",
  "Zong",
  "Telenor Pakistan",
  "Ufone",
  "PTCL",
  "Oil and Gas Development Company (OGDCL)",
  "Pakistan State Oil (PSO)",
  "Pakistan Petroleum Limited (PPL)",
  "Mari Petroleum",
  "Sui Northern Gas Pipelines (SNGPL)",
  "Sui Southern Gas Company (SSGC)",
  "K-Electric",
  "Hub Power Company (HUBCO)",
  "Kot Addu Power Company (KAPCO)",
  "WAPDA",
  "Fauji Fertilizer Company",
  "Engro Corporation",
  "Engro Fertilizers",
  "Fauji Foundation",
  "Nishat Group",
  "Nishat Mills",
  "Dawood Group",
  "Packages Limited",
  "Lucky Cement",
  "DG Khan Cement",
  "Maple Leaf Cement",
  "Fauji Cement",
  "Bestway Cement",
  "Attock Cement",
  "Gul Ahmed",
  "Alkaram",
  "Interloop",
  "Sapphire Textile",
  "Khaadi",
  "Daraz",
  "Metro Pakistan",
  "Carrefour Pakistan",
  "Imtiaz Super Market",
  "Naheed Supermarket",
  "Chase Up",
  "TCS",
  "Leopards Courier",
  "Pakistan Post",
  "Pakistan International Airlines (PIA)",
  "Airblue",
  "SereneAir",
  "Systems Limited",
  "NETSOL Technologies",
  "TRG Pakistan",
  "Afiniti",
  "VentureDive",
  "Arbisoft",
  "10Pearls",
  "Careem",
  "Bykea",
  "Pak Suzuki",
  "Indus Motor Company (Toyota)",
  "Honda Atlas",
  "Hyundai Nishat",
  "Kia Lucky Motors",
  "Millat Tractors",
  "Atlas Honda",
  "Nestle Pakistan",
  "Unilever Pakistan",
  "Procter & Gamble Pakistan",
  "Coca-Cola Beverages Pakistan",
  "PepsiCo Pakistan",
  "Colgate-Palmolive Pakistan",
  "Getz Pharma",
  "GSK Pakistan",
  "Abbott Pakistan",
  "Searle Pakistan",
  "Ferozsons Laboratories",
  "Aga Khan University Hospital",
  "Shaukat Khanum Memorial Cancer Hospital",
  "Indus Hospital",
  "Liaquat National Hospital",
  "Aga Khan University",
  "LUMS",
  "NUST",
  "FAST-NUCES",
  "GIKI",
  "IBA Karachi",
  "COMSATS",
  "Beaconhouse",
  "The City School",
  "Dawn Media Group",
  "Jang Group",
  "Geo News",
  "ARY",
  "Express Media Group",
  "Bahria Town",
  "Defence Housing Authority (DHA)",
  "National Highway Authority (NHA)",
  "Federal Board of Revenue (FBR)",
  "KFC Pakistan",
  "McDonald's Pakistan",
  "Pizza Hut Pakistan",
  "Pakistan Tobacco Company",
]);

export const GLOBAL_COMPANIES = uniqueList([
  "Google",
  "Microsoft",
  "Apple",
  "Amazon",
  "Meta",
  "Netflix",
  "Tesla",
  "IBM",
  "Oracle",
  "SAP",
  "Adobe",
  "Intel",
  "AMD",
  "NVIDIA",
  "Samsung",
  "Huawei",
  "Accenture",
  "Deloitte",
  "PwC",
  "EY",
  "KPMG",
  "McKinsey & Company",
  "Boston Consulting Group",
  "Bain & Company",
  "Uber",
  "Airbnb",
  "Booking.com",
  "Spotify",
  "Stripe",
  "Shopify",
  "Salesforce",
  "Atlassian",
  "Cisco",
  "Dell",
  "HP",
  "Lenovo",
  "Xiaomi",
  "Sony",
  "Toyota",
  "BMW",
  "Mercedes-Benz",
  "Volkswagen",
  "Shell",
  "BP",
  "ExxonMobil",
  "Chevron",
  "Unilever",
  "Nestle",
  "PepsiCo",
  "Coca-Cola",
  "Procter & Gamble",
  "Johnson & Johnson",
  "Pfizer",
  "Roche",
  "Novartis",
  "Siemens",
  "General Electric",
  "ABB",
  "Honeywell",
  "FedEx",
  "DHL",
  "UPS",
]);

export const COMPANY_SUGGESTIONS = uniqueList([
  ...PAKISTANI_COMPANIES,
  ...GLOBAL_COMPANIES,
]);

export const MONTH_OPTIONS = [
  { value: "Jan", label: "January" },
  { value: "Feb", label: "February" },
  { value: "Mar", label: "March" },
  { value: "Apr", label: "April" },
  { value: "May", label: "May" },
  { value: "Jun", label: "June" },
  { value: "Jul", label: "July" },
  { value: "Aug", label: "August" },
  { value: "Sep", label: "September" },
  { value: "Oct", label: "October" },
  { value: "Nov", label: "November" },
  { value: "Dec", label: "December" },
];

export const buildYearOptions = (
  startYear = 1970,
  endYear = new Date().getFullYear() + 1
) => {
  const years: string[] = [];
  for (let year = endYear; year >= startYear; year -= 1) {
    years.push(String(year));
  }
  return years;
};

export const buildMonthYear = (month: string, year: string) =>
  month && year ? `${month} ${year}` : "";

const normalize = (value: string) => value.toLowerCase().trim();

const tokenize = (value: string) =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

const BULLET_BANK: KeywordBucket[] = [
  {
    keywords: [
      "software",
      "developer",
      "engineer",
      "frontend",
      "back",
      "full",
      "mobile",
      "devops",
      "cloud",
      "qa",
      "test",
      "security",
      "sre",
      "data engineer",
    ],
    bullets: [
      "Built and maintained features using modern frameworks to improve stability.",
      "Optimized APIs and database queries to improve response times.",
      "Implemented automated tests and CI/CD pipelines to reduce defects.",
      "Collaborated with product and design teams to deliver user-focused solutions.",
      "Reviewed code and mentored teammates to improve code quality.",
      "Monitored production systems and resolved incidents quickly.",
    ],
  },
  {
    keywords: ["data", "analyst", "bi", "analytics", "insight"],
    bullets: [
      "Analyzed datasets to identify trends and actionable insights.",
      "Built dashboards and reports to track KPIs and performance.",
      "Cleaned and validated data to ensure accuracy and consistency.",
      "Automated recurring reports to improve turnaround time.",
      "Partnered with stakeholders to define metrics and requirements.",
      "Presented findings with clear visuals and recommendations.",
    ],
  },
  {
    keywords: ["product", "project", "program", "scrum", "manager"],
    bullets: [
      "Led cross-functional projects with clear timelines and milestones.",
      "Managed scope, risks, and dependencies to deliver on schedule.",
      "Facilitated standups and stakeholder updates for alignment.",
      "Defined requirements and ensured successful delivery outcomes.",
      "Tracked progress using agile tools and reporting.",
      "Coordinated resources to optimize delivery and quality.",
    ],
  },
  {
    keywords: ["marketing", "seo", "social", "brand", "growth", "content"],
    bullets: [
      "Planned and executed marketing campaigns to drive engagement.",
      "Managed SEO and content strategy to improve organic traffic.",
      "Analyzed campaign performance and optimized for ROI.",
      "Coordinated with designers and writers to deliver assets.",
      "Managed social media calendars and community engagement.",
      "Developed messaging that aligned with brand guidelines.",
    ],
  },
  {
    keywords: ["sales", "account", "business development"],
    bullets: [
      "Built and managed a sales pipeline to meet revenue targets.",
      "Conducted product demos and handled client negotiations.",
      "Maintained strong client relationships to drive retention.",
      "Prepared proposals and closed deals in competitive markets.",
      "Collaborated with marketing to align lead generation efforts.",
      "Tracked forecasts and reported weekly performance.",
    ],
  },
  {
    keywords: ["finance", "accountant", "audit", "tax"],
    bullets: [
      "Prepared monthly financial statements and reconciliations.",
      "Managed budgets and forecasts to support planning.",
      "Ensured compliance with accounting standards and policies.",
      "Supported audits by organizing documentation and reports.",
      "Analyzed costs and identified savings opportunities.",
      "Processed invoices and maintained accurate records.",
    ],
  },
  {
    keywords: ["operations", "supply", "procurement", "logistics"],
    bullets: [
      "Streamlined workflows to improve operational efficiency.",
      "Coordinated vendors and procurement to ensure timely delivery.",
      "Tracked inventory levels and optimized replenishment.",
      "Developed SOPs to standardize processes and quality.",
      "Monitored KPIs and reported performance to leadership.",
      "Resolved operational issues and reduced delays.",
    ],
  },
  {
    keywords: ["hr", "recruit", "talent", "people"],
    bullets: [
      "Managed end-to-end recruitment and onboarding processes.",
      "Maintained HR policies, records, and employee documentation.",
      "Supported performance reviews and training initiatives.",
      "Handled employee relations and resolved workplace issues.",
      "Improved HR processes to increase efficiency and compliance.",
      "Coordinated engagement activities to boost morale.",
    ],
  },
  {
    keywords: ["customer", "support", "service", "success"],
    bullets: [
      "Resolved customer issues while meeting SLA targets.",
      "Documented solutions and built knowledge base articles.",
      "Escalated critical cases and coordinated with internal teams.",
      "Collected feedback to improve products and service quality.",
      "Tracked customer satisfaction scores and reported trends.",
      "Trained new support agents and shared best practices.",
    ],
  },
  {
    keywords: ["design", "ux", "ui", "graphic"],
    bullets: [
      "Created user-centered designs based on research and feedback.",
      "Built wireframes and prototypes to validate concepts.",
      "Collaborated with developers to ensure design feasibility.",
      "Maintained design systems for consistency across products.",
      "Conducted usability testing and iterated on findings.",
      "Delivered marketing assets aligned with brand guidelines.",
    ],
  },
  {
    keywords: ["education", "teacher", "trainer", "lecturer"],
    bullets: [
      "Designed lesson plans and training materials for learners.",
      "Delivered engaging sessions and assessed learning outcomes.",
      "Provided feedback and coaching to improve performance.",
      "Adapted curriculum based on student needs and results.",
      "Used digital tools to enhance learning experiences.",
      "Collaborated with staff to align on academic goals.",
    ],
  },
  {
    keywords: ["nurse", "medical", "health", "pharmacist", "lab"],
    bullets: [
      "Delivered patient care while following clinical protocols.",
      "Maintained accurate medical records and documentation.",
      "Coordinated with healthcare teams to support treatment.",
      "Educated patients and families on care plans.",
      "Ensured safety and hygiene standards at all times.",
      "Assisted in procedures and monitored vital signs.",
    ],
  },
  {
    keywords: ["legal", "compliance", "risk"],
    bullets: [
      "Drafted and reviewed contracts and legal documents.",
      "Ensured compliance with regulatory requirements.",
      "Conducted risk assessments and recommended controls.",
      "Maintained legal records and case documentation.",
      "Advised internal teams on policy and compliance matters.",
      "Supported audits and regulatory inquiries.",
    ],
  },
  {
    keywords: ["manufacturing", "production", "quality", "plant"],
    bullets: [
      "Monitored production output and quality standards.",
      "Implemented quality checks to reduce defects.",
      "Maintained equipment and coordinated maintenance schedules.",
      "Improved processes to increase throughput and safety.",
      "Tracked KPIs and reported operational performance.",
      "Ensured compliance with safety and HSE guidelines.",
    ],
  },
  {
    keywords: ["admin", "assistant", "office", "reception"],
    bullets: [
      "Managed calendars, meetings, and daily schedules.",
      "Prepared documents, reports, and correspondence.",
      "Handled calls, emails, and visitor coordination.",
      "Maintained records, filing systems, and office supplies.",
      "Supported executives with travel and logistics.",
      "Assisted teams with administrative tasks as needed.",
    ],
  },
];

export const getSuggestedBullets = (jobTitle: string, limit = 8) => {
  const normalized = normalize(jobTitle);
  const matches = BULLET_BANK.filter((bucket) =>
    bucket.keywords.some((keyword) => normalized.includes(keyword))
  );

  const bullets = matches.length
    ? matches.flatMap((bucket) => bucket.bullets)
    : [];

  return uniqueList(bullets).slice(0, limit);
};

export const getRelatedJobTitles = (
  jobTitle: string,
  options = JOB_TITLE_SUGGESTIONS,
  limit = 8
) => {
  const tokens = tokenize(jobTitle);
  if (tokens.length === 0) {
    return options.slice(0, limit);
  }

  const scored = options
    .map((title) => {
      const normalizedTitle = normalize(title);
      const score = tokens.reduce(
        (acc, token) => (normalizedTitle.includes(token) ? acc + 1 : acc),
        0
      );
      return { title, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  if (scored.length === 0) {
    return options.slice(0, limit);
  }

  return scored.slice(0, limit).map((item) => item.title);
};
