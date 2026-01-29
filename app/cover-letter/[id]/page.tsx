"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCoverLetter } from "@/contexts/CoverLetterContext";
import { CoverLetterEditor } from "@/components/cover-letter/CoverLetterEditor";
import { Spinner } from "@/components/ui/spinner";

export default function CoverLetterEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { currentCoverLetter, loadCoverLetter, isLoading } = useCoverLetter();

  useEffect(() => {
    if (params.id && typeof params.id === "string") {
      if (!currentCoverLetter || currentCoverLetter.id !== params.id) {
        loadCoverLetter(params.id);
      }
    }
  }, [params.id, currentCoverLetter, loadCoverLetter]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!currentCoverLetter) {
    return null;
  }

  return (
    <div className="pt-24">
      <CoverLetterEditor />
    </div>
  );
}
