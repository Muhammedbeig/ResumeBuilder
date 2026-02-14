import type { CoverLetterData } from "@/types";

export const previewCoverLetterData: CoverLetterData = {
  personalInfo: {
    fullName: "Alex Morgan",
    email: "alex.morgan@example.com",
    phone: "(555) 123-4567",
    address: "123 Innovation Dr",
    city: "San Francisco",
    zipCode: "94103",
  },
  recipientInfo: {
    managerName: "Sarah Connor",
    companyName: "TechCorp Inc.",
    address: "456 Future Way",
    city: "San Francisco",
    zipCode: "94105",
    email: "hiring@techcorp.com",
  },
  content: {
    subject: "Application for Senior Product Designer Position",
    greeting: "Dear Ms. Connor,",
    opening:
      "I am excited to apply for the Senior Product Designer role at TechCorp Inc.",
    body:
      "With 7+ years of product design experience, I have led design systems and UX improvements that increased activation and reduced churn across SaaS products.",
    closing: "Thank you for your time and consideration.",
    signature: "Alex Morgan",
  },
};
