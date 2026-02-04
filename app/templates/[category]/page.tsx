import { TemplatesCatalogPage } from "@/components/pages/TemplatesCatalogPage";

interface TemplatesCategoryPageProps {
  params: { category: string };
}

export default function TemplatesCategoryPage({ params }: TemplatesCategoryPageProps) {
  return <TemplatesCatalogPage initialCategory={params.category} />;
}
