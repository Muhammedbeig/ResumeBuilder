"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useCoverLetter } from "@/contexts/CoverLetterContext";
import { CoverLetterEditor } from "@/components/cover-letter/CoverLetterEditor";
import { Spinner } from "@/components/ui/spinner";
import { useRuntimeRouteParam } from "@/lib/use-runtime-route-param";

export default function CoverLetterEditorClient() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const { currentCoverLetter, loadCoverLetter, isLoading } = useCoverLetter();
  const [loadResolved, setLoadResolved] = useState(false);
  const paramCoverLetterId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;
  const coverLetterId = useRuntimeRouteParam(
    "/cover-letter",
    typeof paramCoverLetterId === "string" ? paramCoverLetterId : null,
  );

  useEffect(() => {
    if (!coverLetterId) {
      setLoadResolved(true);
      return;
    }

    let cancelled = false;
    const targetId = coverLetterId;

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
  }, [coverLetterId, currentCoverLetter?.id, loadCoverLetter]);

  useEffect(() => {
    if (!coverLetterId) return;
    if (status === "loading" || isLoading || !loadResolved) return;
    if (currentCoverLetter?.id === coverLetterId) return;
    router.replace("/cover-letter/new");
  }, [
    coverLetterId,
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
