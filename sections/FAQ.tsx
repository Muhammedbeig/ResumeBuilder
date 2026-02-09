import { panelGet } from "@/lib/panel-api";
import { FAQClient, type FaqItem } from "@/sections/FAQClient";

export const dynamic = "force-dynamic";

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
    return rows
      .map((row) => ({
        question: (row.translated_question ?? row.question ?? "").trim(),
        answer: (row.translated_answer ?? row.answer ?? "").trim(),
      }))
      .filter((item) => item.question.length > 0 && item.answer.length > 0);
  } catch {
    return [];
  }
}

export async function FAQ() {
  const faqs = await loadFaqs();
  return <FAQClient faqs={faqs} />;
}

