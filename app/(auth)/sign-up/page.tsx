"use client";

import { SignupForm } from "@/components/auth/signup-form"
import { useAuthContext } from "@/contexts/auth-context";

export default function SignupPage() {
  const { signUp } = useAuthContext();
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  )
}
