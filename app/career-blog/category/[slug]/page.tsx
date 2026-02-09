import { redirect } from "next/navigation";

// Backward-compatible route: the Panel uses "tags" (keywords), not categories.
export default async function CareerBlogCategoryRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/career-blog/tag/${encodeURIComponent(slug)}`);
}

