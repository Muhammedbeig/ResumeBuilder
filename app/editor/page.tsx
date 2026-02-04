"use client";

import { ResumeProvider } from "@/contexts/NoDbResumeContext";
import { PlanChoiceProvider } from "@/contexts/PlanChoiceContext";
import { ResumeEditorPage } from "@/components/pages/ResumeEditor";

export default function NoDbEditorPage() {
  return (
    <PlanChoiceProvider>
      <ResumeProvider>
        <ResumeEditorPage />
      </ResumeProvider>
    </PlanChoiceProvider>
  );
}
