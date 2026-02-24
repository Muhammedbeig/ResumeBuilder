import CoverLetterEditorClient from "./CoverLetterEditorClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function CoverLetterEditorPage() {
  return <CoverLetterEditorClient />;
}
