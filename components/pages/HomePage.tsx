import { Hero } from '@/sections/Hero';
import { Features } from '@/sections/Features';
import { HowItWorks } from '@/sections/HowItWorks';
import { Testimonials } from '@/sections/Testimonials';
import { Pricing } from '@/sections/Pricing';
import { FAQ } from '@/sections/FAQ';
import { CTA } from '@/sections/CTA';
import { Footer } from '@/sections/Footer';

export function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
