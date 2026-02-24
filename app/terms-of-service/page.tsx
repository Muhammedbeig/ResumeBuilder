import { LegalPolicyContent } from "@/components/pages/LegalPolicyContent";
import { Footer } from "@/sections/Footer";

export default function TermsOfServicePage() {
  return (
    <>
      <LegalPolicyContent
        label="Terms"
        title="Terms of Service"
        descriptionTemplate="The rules and conditions for using {brandName}."
        policyField="termsConditions"
        emptyMessage="The terms of service are not available yet. Please check back later."
      />
      <Footer />
    </>
  );
}
