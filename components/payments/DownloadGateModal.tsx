"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { APP_DOWNLOAD_URL } from "@/lib/app-links";
import { createQrDataUrl } from "@/lib/qr";
import type { PlanChoice } from "@/contexts/PlanChoiceContext";
import { Crown, QrCode } from "lucide-react";

interface DownloadGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planChoice: PlanChoice | null;
  hasSubscription: boolean;
  resourceType?: "resume" | "cv" | "cover_letter";
  resourceId?: string | null;
  isActivating?: boolean;
}

type LinkResponse = {
  resolverUrl: string;
  expiresAt?: string;
};

export function DownloadGateModal({
  open,
  onOpenChange,
  planChoice,
  hasSubscription,
  resourceType,
  resourceId,
  isActivating = false,
}: DownloadGateModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [resolverUrl, setResolverUrl] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const isPaidSelected = planChoice === "paid";
  const hasAccess = !isPaidSelected || hasSubscription;
  const downloadHref = resolverUrl ?? APP_DOWNLOAD_URL;

  useEffect(() => {
    let isMounted = true;

    // Reset state on open so we don't show stale QR/token.
    if (open) {
      setQrDataUrl(null);
      setResolverUrl(null);
      setLinkError(null);
    }

    if (!open || !hasAccess) return;

    if (!resourceType || !resourceId) {
      setIsQrLoading(true);
      createQrDataUrl(APP_DOWNLOAD_URL, 220)
        .then((dataUrl) => {
          if (isMounted) setQrDataUrl(dataUrl);
        })
        .catch(() => {
          if (isMounted) setQrDataUrl(null);
        })
        .finally(() => {
          if (isMounted) setIsQrLoading(false);
        });
      return;
    }

    setIsQrLoading(true);

    (async () => {
      try {
        const response = await fetch("/api/app-download-links", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resourceType,
            resourceId,
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please sign in to download.");
          }
          if (response.status === 404) {
            throw new Error("Document not found.");
          }
          throw new Error("Unable to create a download link.");
        }

        const payload = (await response.json()) as LinkResponse;
        const nextUrl = typeof payload?.resolverUrl === "string" ? payload.resolverUrl : null;
        if (!nextUrl) {
          throw new Error("Invalid download link response.");
        }

        const qr = await createQrDataUrl(nextUrl, 220);

        if (!isMounted) return;
        setResolverUrl(nextUrl);
        setQrDataUrl(qr);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create a download link.";

        if (!isMounted) return;
        setLinkError(message);

        // Fallback: still show a QR to install the app.
        try {
          const qr = await createQrDataUrl(APP_DOWNLOAD_URL, 220);
          if (isMounted) setQrDataUrl(qr);
        } catch {
          if (isMounted) setQrDataUrl(null);
        }
      } finally {
        if (isMounted) setIsQrLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [open, hasAccess, resourceType, resourceId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl border-slate-800 bg-slate-950 text-white">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">Download via Mobile App</DialogTitle>
          <DialogDescription className="text-slate-300">
            {isPaidSelected
              ? "Complete your setup to unlock watermark-free downloads and access the mobile app."
              : "Downloads are available through our mobile app."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!hasAccess && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-300">
              {isActivating ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border border-slate-400 border-t-transparent" />
                  Confirming your payment and activating your plan...
                </span>
              ) : (
                "Choose a paid plan to unlock mobile app downloads."
              )}
            </div>
          )}

          {hasAccess && (
            <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
              <div className="space-y-4">
                {isPaidSelected && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
                    <Crown className="h-3.5 w-3.5" />
                    Paid Plan
                  </div>
                )}

                {!isPaidSelected && (
                  <p className="text-sm text-slate-300">
                    Downloads are delivered from the mobile app. Scan the QR or use the button to open the app.
                  </p>
                )}

                {linkError && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                    {linkError}
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-200">
                    {isPaidSelected
                      ? "Watermark removed. Download your file from the app."
                      : "Download your file from the app."}
                  </p>
                  <Button asChild className="mt-4 w-full bg-white text-slate-900 hover:bg-white/90">
                    <a href={downloadHref} target="_blank" rel="noopener noreferrer">
                      Open in App
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
                  <QrCode className="h-4 w-4" />
                  Scan to Open
                </div>
                <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-white p-3">
                  {isQrLoading || !qrDataUrl ? (
                    <div className="h-full w-full animate-pulse rounded-xl bg-slate-200" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="Download QR code" className="h-full w-full" />
                  )}
                </div>
                <p className="mt-3 text-xs text-slate-300">Open your camera and scan the code.</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


