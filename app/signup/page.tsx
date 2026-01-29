import { Suspense } from "react";
import { SignupPage } from "@/components/pages/SignupPage";
import { Spinner } from "@/components/ui/spinner";

export default function Signup() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <SignupPage />
    </Suspense>
  );
}
