import { LegalPolicyContent } from "@/components/pages/LegalPolicyContent";
import { Footer } from "@/sections/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <LegalPolicyContent
        label="Privacy"
        title="Privacy Policy"
        descriptionTemplate="How {brandName} collects, uses, and protects your information."
        policyField="privacyPolicy"
        emptyMessage="The privacy policy is not available yet. Please check back later."
      />
      <Footer />
    </>
  );
}
