"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, User, MessageSquare, PencilLine, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeRichContent } from "@/lib/rich-content";

type ContactPageProps = {
  introHtml?: string;
  companyEmail?: string;
  companyTel1?: string;
  companyTel2?: string;
  companyAddress?: string;
};

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactPage({
  introHtml,
  companyEmail,
  companyTel1,
  companyTel2,
  companyAddress,
}: ContactPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialState);
  const normalizedIntroHtml = normalizeRichContent(introHtml);
  const contactDetails = [
    companyEmail ? { label: "Email", value: companyEmail, href: `mailto:${companyEmail}` } : null,
    companyTel1 ? { label: "Phone", value: companyTel1, href: `tel:${companyTel1}` } : null,
    companyTel2 ? { label: "Alt Phone", value: companyTel2, href: `tel:${companyTel2}` } : null,
    companyAddress ? { label: "Address", value: companyAddress } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href?: string }>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const response = await fetch("/api/contact-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data?.error || "Failed to send message");
        return;
      }

      toast.success("Message sent! We'll get back to you soon.");
      setFormData(initialState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-widest">Contact</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
            Send a message to the team
          </h1>
          {normalizedIntroHtml ? (
            <div
              className="mt-4 rich-content"
              dangerouslySetInnerHTML={{ __html: normalizedIntroHtml }}
            />
          ) : (
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Your message is stored directly in the Admin Panel so our support team can reply faster.
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/career-blog"
              className="rounded-full border border-purple-200 px-5 py-2 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:border-purple-400 transition"
            >
              Browse the Blog
            </Link>
            <Link
              href="/#faq"
              className="rounded-full border border-purple-200 px-5 py-2 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:border-purple-400 transition"
            >
              Read FAQs
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Contact form</CardTitle>
                <CardDescription>
                  Fields are required. We use this information only to respond to your request.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="relative">
                    <PencilLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Textarea
                      placeholder="Message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="min-h-[140px] pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send message"}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">What happens next?</h2>
              <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                  Your message is saved in the Admin Panel under Contact Us.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                  Our team can review and respond using the details you provide.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
                  For common questions, check the FAQ section first.
                </li>
              </ul>
            </div>

            {contactDetails.length > 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Contact details</h2>
                <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  {contactDetails.map((detail) => (
                    <div key={detail.label} className="flex flex-col gap-1">
                      <span className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        {detail.label}
                      </span>
                      {detail.href ? (
                        <a href={detail.href} className="font-semibold text-purple-600 hover:text-purple-500">
                          {detail.value}
                        </a>
                      ) : (
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {detail.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
