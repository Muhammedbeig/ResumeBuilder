import { TemplatesCatalogPage } from "@/components/pages/TemplatesCatalogPage";

interface TemplatesCategoryPageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return [{ category: "all" }];
}

export default async function TemplatesCategoryPage({
  params,
}: TemplatesCategoryPageProps) {
  const resolvedParams = await params;
  return <TemplatesCatalogPage initialCategory={resolvedParams.category} />;
}
