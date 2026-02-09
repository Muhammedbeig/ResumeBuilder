"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PricingSection } from "@/components/pricing/PricingSection";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { BANK_TRANSFER_ADMIN_EMAIL, BANK_TRANSFER_DETAILS } from "@/lib/bank-transfer";
import type { PricingCard } from "@/lib/panel-pricing";
import type { PaidPlanId } from "@/lib/pricing-plans";
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

const mapDurationToPlanId = (duration: string, price: number): PaidPlanId | null => {
  const normalized = String(duration ?? "").trim().toLowerCase();
  if (!normalized) return null;
  if (price <= 0) return null;
  if (normalized === "7") return "weekly";
  if (normalized === "30") return "monthly";
  if (normalized === "365" || normalized === "unlimited") return "annual";
  return null;
};

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

  const handleSelectPackage = (packageId?: string) => {
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
    if (!selectedPackage) return;
    const planId = mapDurationToPlanId(selectedPackage.duration, selectedPackage.finalPrice);
    if (!planId) {
      toast.error("Stripe checkout is not configured for this package.");
      return;
    }

    setIsRedirecting(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, returnUrl: safeReturnUrl }),
      });
      if (response.status === 401) {
        const callbackUrl = `/pricing?flow=${encodeURIComponent(flow ?? "download")}&returnUrl=${encodeURIComponent(
          safeReturnUrl
        )}`;
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }
      if (!response.ok) {
        throw new Error("Checkout failed");
      }
      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Missing checkout URL");
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
