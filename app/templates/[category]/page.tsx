import { TemplatesCatalogPage } from "@/components/pages/TemplatesCatalogPage";

interface TemplatesCategoryPageProps {
  params: Promise<{ category: string }>;
}

export default async function TemplatesCategoryPage({
  params,
}: TemplatesCategoryPageProps) {
  const resolvedParams = await params;
  return <TemplatesCatalogPage initialCategory={resolvedParams.category} />;
}
