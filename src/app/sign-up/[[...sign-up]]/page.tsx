import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={null}>
        <SignUp fallbackRedirectUrl="/dashboard" signInUrl="/sign-in" />
      </Suspense>
    </div>
  );
}
