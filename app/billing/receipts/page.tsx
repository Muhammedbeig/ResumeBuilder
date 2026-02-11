"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BANK_TRANSFER_ADMIN_EMAIL,
  BANK_TRANSFER_DETAILS,
  type BankTransferSettings,
  type BankTransferSettingsResponse,
} from "@/lib/bank-transfer";
import type { PricingCard } from "@/lib/panel-pricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Receipt = {
  id: string;
  packageId: string | null;
  packageName: string | null;
  amount: number;
  status: string;
  orderId: string | null;
  receiptUrl: string | null;
  createdAt: string | null;
};

export default function ReceiptsPage() {
  const [cards, setCards] = useState<PricingCard[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [bankTransferDetails, setBankTransferDetails] = useState<BankTransferSettings>({
    enabled: true,
    accountHolderName: BANK_TRANSFER_DETAILS.accountName,
    bankName: BANK_TRANSFER_DETAILS.bankName,
    accountNumber: BANK_TRANSFER_DETAILS.accountNumber,
    ifscSwiftCode: BANK_TRANSFER_DETAILS.swift || BANK_TRANSFER_DETAILS.iban || "",
  });
  const [bankTransferEmail, setBankTransferEmail] = useState(BANK_TRANSFER_ADMIN_EMAIL);
  const [bankTransferLoaded, setBankTransferLoaded] = useState(false);

  const paidCards = useMemo(() => cards.filter((c) => c.isPaid), [cards]);
  const packageOptions = useMemo(
    () =>
      paidCards.map((card) => ({
        value: card.packageId,
        label: `${card.name} (${card.priceLabel})`,
      })),
    [paidCards]
  );
  const bankTransferAvailable = bankTransferLoaded && bankTransferDetails.enabled;
  const bankDetailRows = [
    { label: "Account Holder Name", value: bankTransferDetails.accountHolderName },
    { label: "Bank Name", value: bankTransferDetails.bankName },
    { label: "Account Number", value: bankTransferDetails.accountNumber },
    { label: "IFSC/SWIFT Code", value: bankTransferDetails.ifscSwiftCode },
  ].filter((row) => row.value);

  const loadCards = async () => {
    try {
      const response = await fetch("/api/subscription-packages");
      if (!response.ok) throw new Error("Failed to load packages");
      const data = (await response.json()) as { cards?: PricingCard[] };
      setCards(Array.isArray(data.cards) ? data.cards : []);
    } catch {
      setCards([]);
    }
  };

  const loadReceipts = async () => {
    try {
      const response = await fetch("/api/bank-transfer/receipts");
      if (!response.ok) {
        throw new Error("Failed to load receipts");
      }
      const data = (await response.json()) as { receipts?: Receipt[] };
      setReceipts(Array.isArray(data.receipts) ? data.receipts : []);
    } catch {
      toast.error("Unable to load receipts.");
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([loadCards(), loadReceipts()]).finally(() => setIsLoading(false));
  }, []);

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
    if (selectedPackageId) return;
    const firstPaid = paidCards[0]?.packageId ?? null;
    if (firstPaid) setSelectedPackageId(firstPaid);
  }, [paidCards, selectedPackageId]);

  const handleUpload = async () => {
    if (!bankTransferAvailable) {
      toast.error(
        bankTransferLoaded
          ? "Bank transfer is currently disabled."
          : "Bank transfer settings are still loading."
      );
      return;
    }
    if (!selectedPackageId) {
      toast.error("Please select a package.");
      return;
    }
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
        toast.error("Please sign in to upload a receipt.");
        return;
      }
      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast.success("Receipt submitted. We will verify and activate your subscription.");
      setReceiptFile(null);
      await loadReceipts();
    } catch {
      toast.error("Failed to submit receipt.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Receipts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Upload your bank transfer receipt and email it to {bankTransferEmail}. We verify and activate
            manually.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bank Transfer Details</h2>
              {!bankTransferLoaded ? (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Loading bank transfer details...
                </p>
              ) : bankDetailRows.length > 0 ? (
                <div className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-gray-300">
                  {bankDetailRows.map((row) => (
                    <p key={row.label}>
                      <strong>{row.label}:</strong> {row.value}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Bank transfer details are not available yet.
                </p>
              )}
              {bankTransferLoaded && !bankTransferDetails.enabled ? (
                <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                  Bank transfer is currently disabled.
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
              <div className="space-y-2">
                <Label>Package</Label>
                <Select value={selectedPackageId ?? ""} onValueChange={setSelectedPackageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Receipt File</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg"
                  disabled={!bankTransferAvailable}
                  onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
                />
              </div>
            </div>

            <Button onClick={handleUpload} disabled={isUploading || !bankTransferAvailable}>
              {isUploading ? "Uploading..." : "Submit Receipt"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Receipts</h2>
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading receipts...</p>
            ) : receipts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No receipts uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {receipt.packageName ?? "Package"} · ${Number(receipt.amount ?? 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {receipt.createdAt ? new Date(receipt.createdAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          receipt.status === "succeed"
                            ? "bg-green-100 text-green-700"
                            : receipt.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {receipt.status}
                      </span>
                      {receipt.receiptUrl ? (
                        <a
                          href={receipt.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-purple-600 hover:underline"
                        >
                          View
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
