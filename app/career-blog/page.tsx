import { Footer } from "@/sections/Footer";
import { CareerBlogPageClient } from "./CareerBlogPageClient";

export const dynamic = "force-static";

export default function CareerBlogPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <CareerBlogPageClient />
      <div className="mt-20">
        <Footer />
      </div>
    </main>
  );
}

