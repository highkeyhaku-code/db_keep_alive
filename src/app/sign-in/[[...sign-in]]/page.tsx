import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={null}>
        <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" />
      </Suspense>
    </div>
  );
}
