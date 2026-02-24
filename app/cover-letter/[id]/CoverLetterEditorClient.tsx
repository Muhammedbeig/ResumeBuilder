"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useCoverLetter } from "@/contexts/CoverLetterContext";
import { CoverLetterEditor } from "@/components/cover-letter/CoverLetterEditor";
import { Spinner } from "@/components/ui/spinner";

export default function CoverLetterEditorClient() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const { currentCoverLetter, loadCoverLetter, isLoading } = useCoverLetter();
  const [loadResolved, setLoadResolved] = useState(false);

  useEffect(() => {
    if (!params.id || typeof params.id !== "string") {
      setLoadResolved(true);
      return;
    }

    let cancelled = false;
    const targetId = params.id;

    if (currentCoverLetter?.id === targetId) {
      setLoadResolved(true);
      return;
    }

    setLoadResolved(false);
    void loadCoverLetter(targetId).finally(() => {
      if (!cancelled) {
        setLoadResolved(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [params.id, currentCoverLetter?.id, loadCoverLetter]);

  useEffect(() => {
    if (!params.id || typeof params.id !== "string") return;
    if (status === "loading" || isLoading || !loadResolved) return;
    if (currentCoverLetter?.id === params.id) return;
    router.replace("/cover-letter/new");
  }, [
    params.id,
    status,
    isLoading,
    loadResolved,
    currentCoverLetter?.id,
    router,
  ]);

  if (status === "loading" || isLoading || !loadResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!currentCoverLetter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden box-border"
      style={{
        paddingTop:
          "calc(var(--app-header-offset, var(--app-header-height)) + var(--app-header-gap, 0px))",
        height: "100vh",
      }}
    >
      <CoverLetterEditor />
    </div>
  );
}
