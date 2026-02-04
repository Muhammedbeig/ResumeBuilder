"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How does the AI resume writing work?",
    answer: "Our AI uses advanced language models trained on thousands of successful resumes. When you input your experience, it rewrites your bullet points using proven frameworks like STAR (Situation, Task, Action, Result) and CAR (Context, Action, Result), focusing on quantifiable achievements and strong action verbs."
  },
  {
    question: "Are the resumes really ATS-friendly?",
    answer: "Yes! All our templates use clean, single-column layouts with standard fonts and formatting that are easily parsed by Applicant Tracking Systems. We avoid graphics, tables, and complex layouts that can confuse ATS software. Our templates have been tested against major ATS platforms."
  },
  {
    question: "Can I import my existing resume?",
    answer: "Absolutely! You can upload your existing resume as a PDF or DOCX file. Our AI will parse the content and structure it automatically. You can then apply any of our templates and use our AI features to improve it."
  },
  {
    question: "How does job tailoring work?",
    answer: "Simply paste any job description, and our AI will: 1) Extract key skills and requirements, 2) Compare them with your resume, 3) Show you a match score, 4) Suggest missing keywords to add, and 5) Rewrite your bullets to better match the job requirements."
  },
  {
    question: "Is my data secure?",
    answer: "We take data security seriously. Your resume data is encrypted at rest and in transit. We never share or sell your information to third parties. You can delete your account and all associated data at any time. We don't train our AI on your personal data unless you explicitly opt-in."
  },
  {
    question: "Can I create multiple versions of my resume?",
    answer: "Yes! You can create unlimited resumes tailored for different roles or industries. Each resume can have its own template, content, and settings. Perfect for career changers or those applying to diverse roles."
  },
  {
    question: "What languages are supported?",
    answer: "Currently, we fully support English and Urdu resume creation. Our AI can help write and optimize resumes in both languages. We're working on adding more languages soon!"
  },
  // {
  //   question: "Can I get a refund if I'm not satisfied?",
  //   answer: "Yes! We offer a 14-day money-back guarantee on all paid plans. If you're not completely satisfied with ResuPro, contact our support team within 14 days of your purchase for a full refund, no questions asked."
  // }
];

export function FAQ() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked 
            <span className="bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              {' '}Questions
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Everything you need to know about ResuPro.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                openIndex === index 
                  ? 'border-purple-300 dark:border-purple-700 shadow-lg shadow-purple-500/10' 
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    openIndex === index 
                      ? 'bg-purple-100 dark:bg-purple-900/30' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <HelpCircle className={`w-5 h-5 transition-colors ${
                      openIndex === index 
                        ? 'text-purple-600' 
                        : 'text-gray-500'
                    }`} />
                  </div>
                  <span className={`text-lg font-medium transition-colors ${
                    openIndex === index 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400'
                  }`}>
                    {faq.question}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.68, -0.6, 0.32, 1.6] }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    openIndex === index 
                      ? 'bg-purple-100 dark:bg-purple-900/30' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <ChevronDown className={`w-5 h-5 transition-colors ${
                    openIndex === index 
                      ? 'text-purple-600' 
                      : 'text-gray-500'
                  }`} />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="px-6 pb-6 pl-20">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
