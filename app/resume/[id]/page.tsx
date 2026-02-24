import { ResumeEditorPage } from "@/components/pages/ResumeEditor";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function ResumeEditor() {
  return <ResumeEditorPage />;
}
