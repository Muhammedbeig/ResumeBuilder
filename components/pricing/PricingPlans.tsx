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
import {
  BANK_TRANSFER_ADMIN_EMAIL,
  BANK_TRANSFER_DETAILS,
  type BankTransferSettings,
  type BankTransferSettingsResponse,
} from "@/lib/bank-transfer";
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

type PaymentSettingsResponse = {
  stripeEnabled?: boolean;
  paypalEnabled?: boolean;
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
  const [isPayPalRedirecting, setIsPayPalRedirecting] = useState(false);
  const safeReturnUrl = useMemo(() => normalizeReturnUrl(returnUrl), [returnUrl]);
  const [isPaymentConfirming, setIsPaymentConfirming] = useState(false);
  const [bankTransferDetails, setBankTransferDetails] = useState<BankTransferSettings>({
    enabled: true,
    accountHolderName: BANK_TRANSFER_DETAILS.accountName,
    bankName: BANK_TRANSFER_DETAILS.bankName,
    accountNumber: BANK_TRANSFER_DETAILS.accountNumber,
    ifscSwiftCode: BANK_TRANSFER_DETAILS.swift || BANK_TRANSFER_DETAILS.iban || "",
  });
  const [bankTransferEmail, setBankTransferEmail] = useState(BANK_TRANSFER_ADMIN_EMAIL);
  const [bankTransferLoaded, setBankTransferLoaded] = useState(false);
  const [paymentSettingsLoaded, setPaymentSettingsLoaded] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [paypalEnabled, setPaypalEnabled] = useState(true);
  const stripeVisible = !paymentSettingsLoaded || stripeEnabled;
  const paypalVisible = !paymentSettingsLoaded || paypalEnabled;
  const bankTransferAvailable = bankTransferLoaded && bankTransferDetails.enabled;
  const bankTransferVisible = !bankTransferLoaded || bankTransferDetails.enabled;
  const bankTransferLabel = !bankTransferLoaded
    ? "Loading bank details..."
    : bankTransferAvailable
    ? "Manual verification required"
    : "Currently unavailable";
  const bankDetailRows = [
    { label: "Account Holder Name", value: bankTransferDetails.accountHolderName },
    { label: "Bank Name", value: bankTransferDetails.bankName },
    { label: "Account Number", value: bankTransferDetails.accountNumber },
    { label: "IFSC/SWIFT Code", value: bankTransferDetails.ifscSwiftCode },
  ].filter((row) => row.value);
  const availableMethods: PaymentMethod[] = [
    stripeVisible ? "card" : null,
    paypalVisible ? "paypal" : null,
    bankTransferAvailable ? "bank" : null,
  ].filter(Boolean) as PaymentMethod[];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const current = new URL(window.location.href);
    const stripeStatus = current.searchParams.get("stripe");
    const paypalStatus = current.searchParams.get("paypal");
    if (!stripeStatus && !paypalStatus) return;

    const paymentTransactionId = current.searchParams.get("payment_transaction_id");
    const checkoutSessionId = current.searchParams.get("session_id");
    const paypalOrderId = current.searchParams.get("order_id") ?? current.searchParams.get("token");

    // Remove payment params from the pricing URL so refresh/back doesn't re-run the handler.
    current.searchParams.delete("stripe");
    current.searchParams.delete("paypal");
    current.searchParams.delete("payment_transaction_id");
    current.searchParams.delete("session_id");
    current.searchParams.delete("order_id");
    current.searchParams.delete("token");
    current.searchParams.delete("PayerID");
    window.history.replaceState({}, "", current.pathname + current.search);

    if (stripeStatus === "cancel" || paypalStatus === "cancel") {
      toast.info("Payment canceled.");
      return;
    }

    if (stripeStatus !== "success" && paypalStatus !== "success") return;

    const origin = window.location.origin;
    const target = new URL(safeReturnUrl, origin);

    // If this purchase was triggered by a download flow, hand off to the editor page
    // so it can open the QR/download modal.
    if (flow === "download" && target.pathname !== "/pricing") {
      if (stripeStatus === "success") {
        target.searchParams.set("stripe", "success");
        if (paymentTransactionId) {
          target.searchParams.set("payment_transaction_id", paymentTransactionId);
        }
        if (checkoutSessionId) {
          target.searchParams.set("session_id", checkoutSessionId);
        }
      } else if (paypalStatus === "success") {
        target.searchParams.set("paypal", "success");
        if (paymentTransactionId) {
          target.searchParams.set("payment_transaction_id", paymentTransactionId);
        }
        if (paypalOrderId) {
          target.searchParams.set("order_id", paypalOrderId);
        }
      }
      router.replace(target.pathname + target.search);
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsPaymentConfirming(true);
      try {
        if (stripeStatus === "success" && paymentTransactionId && checkoutSessionId) {
          await fetchWithTimeout("/api/stripe/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentTransactionId,
              sessionId: checkoutSessionId,
            }),
          }, 15000).catch(() => null);
        }
        if (paypalStatus === "success" && paymentTransactionId && paypalOrderId) {
          await fetchWithTimeout("/api/paypal/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentTransactionId,
              orderId: paypalOrderId,
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
        if (!cancelled) setIsPaymentConfirming(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [flow, router, safeReturnUrl]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const res = await fetch("/api/bank-transfer/settings", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as BankTransferSettingsResponse;
        if (!active) return;
        if (data?.bankTransfer) {
          setBankTransferDetails(data.bankTransfer);
        }
        if (data?.adminEmail) {
          setBankTransferEmail(data.adminEmail);
        }
      } catch {
        // Keep defaults if Panel settings are unavailable.
      } finally {
        if (active) setBankTransferLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const res = await fetch("/api/payment/settings", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as PaymentSettingsResponse;
        if (!active) return;
        if (typeof data?.stripeEnabled === "boolean") {
          setStripeEnabled(data.stripeEnabled);
        }
        if (typeof data?.paypalEnabled === "boolean") {
          setPaypalEnabled(data.paypalEnabled);
        }
      } catch {
        // Keep defaults if Panel settings are unavailable.
      } finally {
        if (active) setPaymentSettingsLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!availableMethods.length) return;
    if (!availableMethods.includes(paymentMethod)) {
      setPaymentMethod(availableMethods[0]);
    }
  }, [availableMethods, paymentMethod]);

  const handleSelectPackage = (packageId?: string) => {
    if (isPaymentConfirming) return;
    if (!packageId) {
      setPlanChoice("free");
      router.push(safeReturnUrl);
      return;
    }

    setPlanChoice("paid");
    setSelectedPackageId(packageId);
    const nextMethod = availableMethods[0] ?? "card";
    setPaymentMethod(nextMethod);
    setIsPaymentOpen(true);
  };
  const handleStripeCheckout = async () => {
    if (!selectedPackageId) return;
    if (paymentSettingsLoaded && !stripeEnabled) {
      toast.error("Stripe is currently disabled.");
      return;
    }

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

  const handlePayPalCheckout = async () => {
    if (!selectedPackageId) return;
    if (paymentSettingsLoaded && !paypalEnabled) {
      toast.error("PayPal is currently disabled.");
      return;
    }

    if (!/^\d+$/.test(selectedPackageId)) {
      toast.error("PayPal checkout is only available when Panel packages are loaded.");
      return;
    }

    setIsPayPalRedirecting(true);
    try {
      const response = await fetch("/api/paypal/checkout", {
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
        toast.error(data?.error || "Unable to start PayPal checkout. Please try again.");
        return;
      }
      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast.error("Missing checkout URL.");
    } catch {
      toast.error("Unable to start PayPal checkout. Please try again.");
    } finally {
      setIsPayPalRedirecting(false);
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
      {isPaymentConfirming && (
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
                {stripeVisible && (
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
                )}

                {paypalVisible && (
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
                    <p className="text-xs text-slate-400">Pay with your PayPal account</p>
                  </button>
                )}

                {bankTransferVisible && (
                  <button
                    type="button"
                    onClick={() => bankTransferAvailable && setPaymentMethod("bank")}
                    disabled={!bankTransferAvailable}
                    className={`rounded-2xl border px-4 py-5 text-left transition ${
                      paymentMethod === "bank"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-slate-800 bg-slate-950"
                    } ${!bankTransferAvailable ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <p className="text-sm font-semibold text-white">Bank Transfer</p>
                    <p className="text-xs text-slate-400">{bankTransferLabel}</p>
                  </button>
                )}
              </div>

              {stripeVisible && paymentMethod === "card" && (
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

              {paypalVisible && paymentMethod === "paypal" && (
                <div className="rounded-2xl border border-slate-800 p-5">
                  <h4 className="text-sm font-semibold text-white">PayPal</h4>
                  <p className="mt-2 text-sm text-slate-400">
                    Complete payment with PayPal, then return to unlock your plan.
                  </p>
                  <div className="mt-4">
                    <Button
                      onClick={handlePayPalCheckout}
                      disabled={isPayPalRedirecting}
                      className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white"
                    >
                      {isPayPalRedirecting ? "Redirecting..." : "Continue to PayPal"}
                    </Button>
                  </div>
                </div>
              )}

              {paymentMethod === "bank" && bankTransferAvailable && (
                <>
                  <div className="rounded-2xl border border-slate-800 p-5">
                    <h4 className="text-sm font-semibold text-white">Bank Details</h4>
                    {bankDetailRows.length > 0 ? (
                      <div className="mt-3 grid gap-2 text-sm text-slate-300">
                        {bankDetailRows.map((row) => (
                          <p key={row.label}>
                            <strong>{row.label}:</strong> {row.value}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">
                        Bank details are not available yet. Please check back later.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-800 p-5">
                    <h4 className="text-sm font-semibold text-white">Upload Receipt</h4>
                    <p className="mt-2 text-sm text-slate-400">
                      After payment, upload your receipt and email it to {bankTransferEmail}. We will verify
                      and activate your subscription.
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

