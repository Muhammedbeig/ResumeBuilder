import BlogPostPageClient from "./BlogPostPageClient";
import { Footer } from "@/sections/Footer";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ slug: "_" }];
}

export default function CareerBlogPostPage() {
  return (
    <>
      <BlogPostPageClient />
      <div className="mt-20">
        <Footer />
      </div>
    </>
  );
}
