"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
}

export function DownloadGateModal({
  open,
  onOpenChange,
  planChoice,
  hasSubscription,
}: DownloadGateModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const isPaidSelected = planChoice === "paid";
  const hasAccess = !isPaidSelected || hasSubscription;

  useEffect(() => {
    let isMounted = true;
    if (!open || !hasAccess) return;
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
    return () => {
      isMounted = false;
    };
  }, [open, hasAccess]);

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
              Choose a paid plan to unlock mobile app downloads.
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
                    Free plan downloads are delivered from the mobile app. Scan the QR or use the button
                    to install the app.
                  </p>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-200">
                    {isPaidSelected
                      ? "Watermark removed. Download your file from the app."
                      : "Download your file from the app."}
                  </p>
                  <Button asChild className="mt-4 w-full bg-white text-slate-900 hover:bg-white/90">
                    <a href={APP_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
                      Download the App
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
                  <QrCode className="h-4 w-4" />
                  Scan to Download
                </div>
                <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-white p-3">
                  {isQrLoading || !qrDataUrl ? (
                    <div className="h-full w-full animate-pulse rounded-xl bg-slate-200" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="App download QR code" className="h-full w-full" />
                  )}
                </div>
                <p className="mt-3 text-xs text-slate-300">
                  Open your camera and scan the code.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
