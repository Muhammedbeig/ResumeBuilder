"use client";

import { ResumeProvider } from "@/contexts/NoDbResumeContext";
import { ResumeEditorPage } from "@/components/pages/ResumeEditor";

export default function NoDbEditorPage() {
  return (
    <ResumeProvider>
      <ResumeEditorPage />
    </ResumeProvider>
  );
}
