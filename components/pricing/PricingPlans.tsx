"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PricingSection } from "@/components/pricing/PricingSection";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { BANK_TRANSFER_ADMIN_EMAIL, BANK_TRANSFER_DETAILS } from "@/lib/bank-transfer";
import type { PricingCard } from "@/lib/panel-pricing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PricingPlansProps = {
  flow?: string;
  returnUrl?: string;
  cards: PricingCard[];
};

const normalizeReturnUrl = (returnUrl?: string) => {
  if (!returnUrl) return "/dashboard";
  if (returnUrl.startsWith("/")) return returnUrl;
  return "/dashboard";
};

type PaymentMethod = "card" | "paypal" | "bank";


export function PricingPlans({ flow, returnUrl, cards }: PricingPlansProps) {
  const router = useRouter();
  const { setPlanChoice } = usePlanChoice();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const safeReturnUrl = useMemo(() => normalizeReturnUrl(returnUrl), [returnUrl]);
  const [isStripeConfirming, setIsStripeConfirming] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const current = new URL(window.location.href);
    const stripeStatus = current.searchParams.get("stripe");
    if (!stripeStatus) return;

    const paymentTransactionId = current.searchParams.get("payment_transaction_id");
    const checkoutSessionId = current.searchParams.get("session_id");

    // Remove Stripe params from the pricing URL so refresh/back doesn't re-run the handler.
    current.searchParams.delete("stripe");
    current.searchParams.delete("payment_transaction_id");
    current.searchParams.delete("session_id");
    window.history.replaceState({}, "", current.pathname + current.search);

    if (stripeStatus === "cancel") {
      toast.info("Payment canceled.");
      return;
    }

    if (stripeStatus !== "success") return;

    const origin = window.location.origin;
    const target = new URL(safeReturnUrl, origin);

    // If this purchase was triggered by a download flow, hand off to the editor page
    // so it can open the QR/download modal.
    if (flow === "download" && target.pathname !== "/pricing") {
      target.searchParams.set("stripe", "success");
      if (paymentTransactionId) {
        target.searchParams.set("payment_transaction_id", paymentTransactionId);
      }
      if (checkoutSessionId) {
        target.searchParams.set("session_id", checkoutSessionId);
      }
      router.replace(target.pathname + target.search);
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsStripeConfirming(true);
      try {
        if (paymentTransactionId && checkoutSessionId) {
          await fetchWithTimeout("/api/stripe/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentTransactionId,
              sessionId: checkoutSessionId,
            }),
          }, 15000).catch(() => null);
        }

        const deadline = Date.now() + 30_000;
        while (!cancelled && Date.now() < deadline) {
          const res = await fetchWithTimeout("/api/user/subscription", { cache: "no-store" }, 8000).catch(
            () => null
          );
          if (res && res.ok) {
            const data: any = await res.json().catch(() => null);
            if (data?.subscription === "pro" || data?.subscription === "business") {
              break;
            }
          }
          await new Promise((r) => setTimeout(r, 1200));
        }

        toast.success("Subscription activated.");
        if (!cancelled) router.replace(target.pathname + target.search);
      } finally {
        if (!cancelled) setIsStripeConfirming(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [flow, router, safeReturnUrl]);

  const handleSelectPackage = (packageId?: string) => {
    if (isStripeConfirming) return;
    if (!packageId) {
      setPlanChoice("free");
      router.push(safeReturnUrl);
      return;
    }

    setPlanChoice("paid");
    setSelectedPackageId(packageId);
    setPaymentMethod("card");
    setIsPaymentOpen(true);
  };
  const handleStripeCheckout = async () => {
    if (!selectedPackageId) return;

    if (!/^\d+$/.test(selectedPackageId)) {
      toast.error("Stripe checkout is only available when Panel packages are loaded.");
      return;
    }

    setIsRedirecting(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPackageId, returnUrl: safeReturnUrl }),
      });
      if (response.status === 401) {
        const callbackUrl = `/pricing?flow=${encodeURIComponent(flow ?? "download")}&returnUrl=${encodeURIComponent(
          safeReturnUrl
        )}`;
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.error(data?.error || "Unable to start Stripe checkout. Please try again.");
        return;
      }
      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast.error("Missing checkout URL.");
    } catch {
      toast.error("Unable to start Stripe checkout. Please try again.");
    } finally {
      setIsRedirecting(false);
    }
  };
  const handleReceiptUpload = async () => {
    if (!selectedPackageId) return;
    if (!receiptFile) {
      toast.error("Please upload a receipt.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("packageId", selectedPackageId);
      formData.append("file", receiptFile);

      const response = await fetch("/api/bank-transfer/receipt", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        const callbackUrl = `/pricing?flow=${encodeURIComponent(flow ?? "download")}&returnUrl=${encodeURIComponent(
          safeReturnUrl
        )}`;
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast.success("Receipt submitted. We will verify and activate your subscription.");
      setReceiptFile(null);
      setIsPaymentOpen(false);
      setSelectedPackageId(null);
    } catch {
      toast.error("Failed to submit receipt.");
    } finally {
      setIsUploading(false);
    }
  };

  const selectedPackage = selectedPackageId
    ? cards.find((c) => c.packageId === selectedPackageId) ?? null
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {isStripeConfirming && (
        <div className="mx-auto max-w-4xl px-4 pt-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border border-slate-400 border-t-transparent" />
              Confirming your payment and activating your plan...
            </span>
          </div>
        </div>
      )}
      <PricingSection
        mode="checkout"
        cards={cards}
        onSelectPackage={handleSelectPackage}
        selectedPackageId={selectedPackageId}
      />

      <Dialog open={isPaymentOpen && !!selectedPackageId} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle>Payment Method</DialogTitle>
            <DialogDescription className="text-slate-300">
              Choose how you want to complete your subscription.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-purple-400">Selected Plan</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedPackage?.name}</h3>
                <p className="text-sm text-slate-400">
                  {selectedPackage?.priceLabel} {selectedPackage?.subtitle ? `- ${selectedPackage.subtitle}` : ""}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`rounded-2xl border px-4 py-5 text-left transition ${
                    paymentMethod === "card"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-slate-800 bg-slate-950"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">Card (Stripe)</p>
                  <p className="text-xs text-slate-400">Visa, Mastercard, AMEX</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className={`rounded-2xl border px-4 py-5 text-left transition ${
                    paymentMethod === "paypal"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-slate-800 bg-slate-950"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">PayPal</p>
                  <p className="text-xs text-slate-400">Coming soon</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={`rounded-2xl border px-4 py-5 text-left transition ${
                    paymentMethod === "bank"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-slate-800 bg-slate-950"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">Bank Transfer</p>
                  <p className="text-xs text-slate-400">Manual verification (Admin Panel)</p>
                </button>
              </div>

              {paymentMethod === "card" && (
                <div className="rounded-2xl border border-slate-800 p-5">
                  <h4 className="text-sm font-semibold text-white">Stripe Checkout</h4>
                  <p className="mt-2 text-sm text-slate-400">
                    Complete payment securely with Stripe, then return to unlock your plan.
                  </p>
                  <div className="mt-4">
                    <Button
                      onClick={handleStripeCheckout}
                      disabled={isRedirecting}
                      className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white"
                    >
                      {isRedirecting ? "Redirecting..." : "Continue to Stripe"}
                    </Button>
                  </div>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className="rounded-2xl border border-slate-800 p-5">
                  <h4 className="text-sm font-semibold text-white">PayPal</h4>
                  <p className="mt-2 text-sm text-slate-400">
                    PayPal is not enabled yet. We can activate it when the gateway is configured.
                  </p>
                </div>
              )}

              {paymentMethod === "bank" && (
                <>
                  <div className="rounded-2xl border border-slate-800 p-5">
                    <h4 className="text-sm font-semibold text-white">Bank Details</h4>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300">
                      <p>
                        <strong>Bank:</strong> {BANK_TRANSFER_DETAILS.bankName}
                      </p>
                      <p>
                        <strong>Account Name:</strong> {BANK_TRANSFER_DETAILS.accountName}
                      </p>
                      <p>
                        <strong>Account Number:</strong> {BANK_TRANSFER_DETAILS.accountNumber}
                      </p>
                      <p>
                        <strong>IBAN:</strong> {BANK_TRANSFER_DETAILS.iban}
                      </p>
                      <p>
                        <strong>SWIFT:</strong> {BANK_TRANSFER_DETAILS.swift}
                      </p>
                      <p>
                        <strong>Branch:</strong> {BANK_TRANSFER_DETAILS.branch}
                      </p>
                      <p>
                        <strong>Country:</strong> {BANK_TRANSFER_DETAILS.country}
                      </p>
                      <p>
                        <strong>Currency:</strong> {BANK_TRANSFER_DETAILS.currency}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 p-5">
                    <h4 className="text-sm font-semibold text-white">Upload Receipt</h4>
                    <p className="mt-2 text-sm text-slate-400">
                      After payment, upload your receipt and email it to {BANK_TRANSFER_ADMIN_EMAIL}. We will verify
                      and activate your subscription from the Admin Panel.
                    </p>
                    <div className="mt-4 space-y-3">
                      <Label htmlFor="receipt-upload">Receipt File</Label>
                      <Input
                        id="receipt-upload"
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
                      />
                      <Button
                        onClick={handleReceiptUpload}
                        disabled={isUploading}
                        className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white"
                      >
                        {isUploading ? "Uploading..." : "Submit Receipt"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

