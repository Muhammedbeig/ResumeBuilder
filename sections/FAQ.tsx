import { panelGet } from "@/lib/panel-api";
import { FAQClient, type FaqItem } from "@/sections/FAQClient";

export const dynamic = "force-dynamic";

const FALLBACK_FAQS: FaqItem[] = [
  {
    question: "Can I build both a resume and a CV on ResuPro?",
    answer:
      "Yes. You can create resumes, CVs, and cover letters with separate editors and template libraries.",
  },
  {
    question: "Are the templates ATS-friendly?",
    answer:
      "Yes. Our templates are designed for ATS compatibility with clean structure, readable typography, and recruiter-friendly formatting.",
  },
  {
    question: "Can I edit my document later after saving?",
    answer:
      "Yes. Your documents remain editable in your dashboard, so you can update content, styling, and layout any time.",
  },
  {
    question: "Can I download documents as PDF?",
    answer:
      "Yes. You can export your resume, CV, and cover letter as PDF once your plan allows downloads.",
  },
  {
    question: "What happens if payment confirmation is delayed?",
    answer:
      "The app automatically checks activation status after checkout. If confirmation takes longer than usual, refresh once and retry from the same account.",
  },
];

type PanelFaq = {
  id: number;
  question?: string;
  answer?: string;
  translated_question?: string;
  translated_answer?: string;
};

async function loadFaqs(): Promise<FaqItem[]> {
  try {
    const res = await panelGet<PanelFaq[]>("faq");
    const rows = Array.isArray(res.data) ? res.data : [];
    const normalized = rows
      .map((row) => ({
        question: (row.translated_question ?? row.question ?? "").trim(),
        answer: (row.translated_answer ?? row.answer ?? "").trim(),
      }))
      .filter((item) => item.question.length > 0 && item.answer.length > 0);

    return normalized.length > 0 ? normalized : FALLBACK_FAQS;
  } catch {
    return FALLBACK_FAQS;
  }
}

export async function FAQ() {
  const faqs = await loadFaqs();
  return <FAQClient faqs={faqs} />;
}
