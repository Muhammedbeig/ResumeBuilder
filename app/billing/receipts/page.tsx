"use client";

import { useEffect, useMemo, useState } from "react";
import { BANK_TRANSFER_ADMIN_EMAIL, BANK_TRANSFER_DETAILS } from "@/lib/bank-transfer";
import { PAID_PLANS } from "@/lib/pricing-plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Receipt = {
  id: string;
  planId: string;
  amountCents: number;
  currency: string;
  filePath: string;
  fileName: string;
  status: string;
  createdAt: string;
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(PAID_PLANS[0]?.planId || "weekly");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const planOptions = useMemo(
    () =>
      PAID_PLANS.map((plan) => ({
        value: plan.planId,
        label: `${plan.name} (${plan.price})`,
      })),
    []
  );

  const loadReceipts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bank-transfer/receipts");
      if (!response.ok) {
        throw new Error("Failed to load receipts");
      }
      const data = await response.json();
      setReceipts(data.receipts || []);
    } catch {
      toast.error("Unable to load receipts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const handleUpload = async () => {
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
            Upload your bank transfer receipt and email it to {BANK_TRANSFER_ADMIN_EMAIL}. We verify and activate manually.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bank Transfer Details</h2>
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

            <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planOptions.map((option) => (
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
                  accept="image/*,application/pdf"
                  onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
                />
              </div>
            </div>

            <Button onClick={handleUpload} disabled={isUploading}>
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
                        {receipt.planId.toUpperCase()} · {(receipt.amountCents / 100).toFixed(2)}{" "}
                        {receipt.currency.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(receipt.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          receipt.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : receipt.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {receipt.status}
                      </span>
                      <a
                        href={receipt.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-purple-600 hover:underline"
                      >
                        View
                      </a>
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
