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
import { PAID_PLANS, type PaidPlanId } from "@/lib/pricing-plans";

type PricingPlansProps = {
  flow?: string;
  returnUrl?: string;
};

const normalizeReturnUrl = (returnUrl?: string) => {
  if (!returnUrl) return "/dashboard";
  if (returnUrl.startsWith("/")) return returnUrl;
  return "/dashboard";
};

type PaymentMethod = "card" | "paypal" | "bank";

export function PricingPlans({ flow, returnUrl }: PricingPlansProps) {
  const router = useRouter();
  const { setPlanChoice } = usePlanChoice();
  const [selectedPlanId, setSelectedPlanId] = useState<PaidPlanId | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<PaidPlanId | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const safeReturnUrl = useMemo(() => normalizeReturnUrl(returnUrl), [returnUrl]);

  const handlePaidCheckout = async (planId: PaidPlanId) => {
    setLoadingPlan(planId);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, returnUrl: safeReturnUrl }),
      });
      if (response.status === 401) {
        const callbackUrl = `/pricing?flow=download&returnUrl=${encodeURIComponent(safeReturnUrl)}`;
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
    } catch (error) {
      toast.error("Unable to start payment. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSelectPlan = (planId?: PaidPlanId) => {
    if (!planId) {
      setPlanChoice("free");
      router.push(safeReturnUrl);
      return;
    }
    setPlanChoice("paid");
    setSelectedPlanId(planId);
    setPaymentMethod("card");
  };

  const handleReceiptUpload = async () => {
    if (!selectedPlanId) return;
    if (!receiptFile) {
      toast.error("Please upload a receipt.");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("planId", selectedPlanId);
      formData.append("file", receiptFile);
      const response = await fetch("/api/bank-transfer/receipt", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      toast.success("Receipt submitted. We will verify and activate your subscription.");
      setReceiptFile(null);
    } catch {
      toast.error("Failed to submit receipt.");
    } finally {
      setIsUploading(false);
    }
  };

  const selectedPlan = selectedPlanId
    ? PAID_PLANS.find((plan) => plan.planId === selectedPlanId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PricingSection
        mode="checkout"
        onSelectPlan={handleSelectPlan}
        selectedPlanId={selectedPlanId}
      />

      {selectedPlanId && (
        <div className="pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-purple-500">Payment Method</p>
                  <h3 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {selectedPlan?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedPlan?.price} · {selectedPlan?.billingNote}
                  </p>
                </div>
                <Button
                  onClick={() => handlePaidCheckout(selectedPlanId)}
                  disabled={loadingPlan === selectedPlanId}
                  className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white"
                >
                  {loadingPlan === selectedPlanId ? "Redirecting..." : "Continue to Stripe"}
                </Button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`rounded-2xl border px-4 py-5 text-left transition ${
                    paymentMethod === "card"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Card (Stripe)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Visa, Mastercard, AMEX</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 px-4 py-5 text-left opacity-60"
                  disabled
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">PayPal</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Coming soon</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={`rounded-2xl border px-4 py-5 text-left transition ${
                    paymentMethod === "bank"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Bank Transfer</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manual verification</p>
                </button>
              </div>

              {paymentMethod === "bank" && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Bank Details</h4>
                    <div className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <p><strong>Bank:</strong> {BANK_TRANSFER_DETAILS.bankName}</p>
                      <p><strong>Account Name:</strong> {BANK_TRANSFER_DETAILS.accountName}</p>
                      <p><strong>Account Number:</strong> {BANK_TRANSFER_DETAILS.accountNumber}</p>
                      <p><strong>IBAN:</strong> {BANK_TRANSFER_DETAILS.iban}</p>
                      <p><strong>SWIFT:</strong> {BANK_TRANSFER_DETAILS.swift}</p>
                      <p><strong>Branch:</strong> {BANK_TRANSFER_DETAILS.branch}</p>
                      <p><strong>Country:</strong> {BANK_TRANSFER_DETAILS.country}</p>
                      <p><strong>Currency:</strong> {BANK_TRANSFER_DETAILS.currency}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Upload Receipt</h4>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      After payment, upload your receipt and email it to {BANK_TRANSFER_ADMIN_EMAIL}.
                      We will verify and activate your subscription.
                    </p>
                    <div className="mt-4 space-y-3">
                      <Label htmlFor="receipt-upload">Receipt File</Label>
                      <Input
                        id="receipt-upload"
                        type="file"
                        accept="image/*,application/pdf"
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
