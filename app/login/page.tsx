import { Suspense } from "react";
import { LoginPage } from "@/components/pages/LoginPage";
import { Spinner } from "@/components/ui/spinner";

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <LoginPage />
    </Suspense>
  );
}
