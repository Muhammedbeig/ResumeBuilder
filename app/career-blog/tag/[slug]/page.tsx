import TagPageClient from "./TagPageClient";
import { Footer } from "@/sections/Footer";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ slug: "_" }];
}

export default function CareerBlogTagPage() {
  return (
    <>
      <TagPageClient />
      <div className="mt-20">
        <Footer />
      </div>
    </>
  );
}
