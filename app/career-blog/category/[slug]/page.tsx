import CategoryPageClient from "./CategoryPageClient";
import { Footer } from "@/sections/Footer";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ slug: "_" }];
}

export default function CareerBlogCategoryPage() {
  return (
    <>
      <CategoryPageClient />
      <div className="mt-20">
        <Footer />
      </div>
    </>
  );
}
