import { CVEditorPage } from "@/components/pages/CVEditorPage";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <CVEditorPage />;
}
