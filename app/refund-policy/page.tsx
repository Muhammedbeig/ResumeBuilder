import { LegalPolicyContent } from "@/components/pages/LegalPolicyContent";
import { Footer } from "@/sections/Footer";

export default function RefundPolicyPage() {
  return (
    <>
      <LegalPolicyContent
        label="Refunds"
        title="Refund Policy"
        descriptionTemplate="Details about refunds and cancellations for {brandName}."
        policyField="refundPolicy"
        emptyMessage="The refund policy is not available yet. Please check back later."
      />
      <Footer />
    </>
  );
}
