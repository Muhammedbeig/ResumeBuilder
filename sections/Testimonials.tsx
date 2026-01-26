"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote, X } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "James Henry",
    role: "Software Engineer at Google",
    content: "ResuPro transformed my resume completely. Within 2 weeks of using the tailored resume, I got interviews at 3 FAANG companies and landed my dream job at Google.",
    rating: 5,
    avatar: "JH"
  },
  {
    id: 2,
    name: "Sara Connor",
    role: "Product Manager at Microsoft",
    content: "The AI bullet rewriting feature is incredible. It turned my boring job descriptions into achievement-focused statements that actually got noticed by recruiters.",
    rating: 5,
    avatar: "SC"
  },
  {
    id: 3,
    name: "Emily Davis",
    role: "UX Designer at Apple",
    content: "As a designer, I loved how I could create a beautiful profile page to showcase my portfolio alongside my resume. Got hired within a month!",
    rating: 5,
    avatar: "ED"
  },
  {
    id: 4,
    name: "Michael Chen",
    role: "Data Scientist at Meta",
    content: "The job tailoring feature is a game changer. I used to apply to 100+ jobs with no response. Now I apply to 10 tailored positions and get 5 callbacks.",
    rating: 5,
    avatar: "MC"
  },
  {
    id: 5,
    name: "Amanda Wilson",
    role: "Marketing Manager at Netflix",
    content: "Finally, a resume builder that understands ATS! My resume now passes through every system and actually reaches human recruiters.",
    rating: 5,
    avatar: "AW"
  },
  {
    id: 6,
    name: "David Kim",
    role: "Senior Developer at Amazon",
    content: "Worth every penny. The time I saved using AI to write and tailor my resume was invaluable during my job search.",
    rating: 5,
    avatar: "DK"
  }
];

export function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedTestimonial, setSelectedTestimonial] = useState<typeof testimonials[0] | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const row1 = testimonials.slice(0, 3);
  const row2 = testimonials.slice(3, 6);

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Loved by Job Seekers 
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {' '}Worldwide
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Join thousands of professionals who have landed their dream jobs with ResuPro.
          </p>
        </motion.div>

        {/* Testimonials Marquee */}
        <div 
          className="space-y-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Row 1 - Left to Right */}
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10" />
            
            <motion.div
              animate={isPaused ? { x: 0 } : { x: [0, -33.33 + '%'] }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear"
              }}
              className="flex gap-6"
              style={{ width: '150%' }}
            >
              {[...row1, ...row1].map((testimonial, idx) => (
                <TestimonialCard 
                  key={`row1-${idx}`} 
                  testimonial={testimonial}
                  onClick={() => setSelectedTestimonial(testimonial)}
                />
              ))}
            </motion.div>
          </div>

          {/* Row 2 - Right to Left */}
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10" />
            
            <motion.div
              animate={isPaused ? { x: 0 } : { x: [-33.33 + '%', 0] }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
              className="flex gap-6"
              style={{ width: '150%', marginLeft: '-50%' }}
            >
              {[...row2, ...row2].map((testimonial, idx) => (
                <TestimonialCard 
                  key={`row2-${idx}`} 
                  testimonial={testimonial}
                  onClick={() => setSelectedTestimonial(testimonial)}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Expanded Modal */}
      {selectedTestimonial && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedTestimonial(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTestimonial(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {selectedTestimonial.avatar}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedTestimonial.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedTestimonial.role}</p>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(selectedTestimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <Quote className="absolute -top-2 -left-2 w-8 h-8 text-purple-200 dark:text-purple-800" />
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed pl-6">
                {selectedTestimonial.content}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: typeof testimonials[0];
  onClick: () => void;
}

function TestimonialCard({ testimonial, onClick }: TestimonialCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className="flex-shrink-0 w-[400px] p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 transition-shadow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold">
          {testimonial.avatar}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
        {testimonial.content}
      </p>
      <div className="flex items-center gap-1 mt-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    </motion.div>
  );
}
