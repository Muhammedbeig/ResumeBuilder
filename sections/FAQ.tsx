"use client";

import { useEffect, useState } from "react";
import { resolveApiUrl } from "@/lib/client-api";
import { FAQClient, type FaqItem } from "@/sections/FAQClient";

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

type PanelFaqEnvelope = {
  error?: boolean;
  data?: PanelFaq[];
};

function normalizeFaqRows(rows: PanelFaq[]): FaqItem[] {
  return rows
    .map((row) => ({
      question: (row.translated_question ?? row.question ?? "").trim(),
      answer: (row.translated_answer ?? row.answer ?? "").trim(),
    }))
    .filter((item) => item.question.length > 0 && item.answer.length > 0);
}

async function fetchFaqsFromApi(): Promise<FaqItem[]> {
  const response = await fetch(resolveApiUrl("/rb/faq"), {
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`FAQ fetch failed (${response.status})`);
  }

  const payload = (await response.json().catch(() => null)) as
    | PanelFaqEnvelope
    | null;
  if (!payload || payload.error) {
    throw new Error("Invalid FAQ response");
  }

  const rows = Array.isArray(payload.data) ? payload.data : [];
  const normalized = normalizeFaqRows(rows);
  return normalized.length > 0 ? normalized : FALLBACK_FAQS;
}

export function FAQ() {
  const [faqs, setFaqs] = useState<FaqItem[]>(FALLBACK_FAQS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const next = await fetchFaqsFromApi();
        if (!active) return;
        setFaqs(next);
      } catch {
        if (!active) return;
        setFaqs(FALLBACK_FAQS);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return <FAQClient faqs={faqs} loading={loading} />;
}

