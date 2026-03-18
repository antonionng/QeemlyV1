"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthSplitShell, AUTH_PUBLIC_HERO_IMAGE_PATH } from "@/components/auth/auth-split-shell";
import { employeeSignup } from "./actions";

function EmployeeRegisterForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const prefillEmail = searchParams.get("email") ?? "";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    formData.set("token", token);
    const result = await employeeSignup(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSubmit(new FormData(event.currentTarget));
  }

  if (!token) {
    return (
      <div className="text-center py-8">
        <p className="text-brand-700 font-medium">Invalid invitation link.</p>
        <p className="text-sm text-brand-500 mt-2">
          Please ask your company administrator for a new invite.
        </p>
        <Link href="/login" className="text-sm text-brand-600 underline mt-4 inline-block">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="space-y-3">
        <label htmlFor="name" className="text-base font-medium text-[#111233]">
          Full name
        </label>
        <Input
          id="name"
          name="name"
          placeholder="Your name"
          autoComplete="name"
          className="h-16 rounded-[32px] border-brand-200/70 px-6 text-[17px] font-medium text-[#111233] placeholder:text-[#111233]/55 focus:ring-brand-100"
          fullWidth
          required
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="email" className="text-base font-medium text-[#111233]">
          Work email
        </label>
        <Input
          id="email"
          name="email"
          placeholder="name@company.com"
          type="email"
          autoComplete="email"
          defaultValue={prefillEmail}
          readOnly={!!prefillEmail}
          className="h-16 rounded-[32px] border-brand-200/70 px-6 text-[17px] font-medium text-[#111233] placeholder:text-[#111233]/55 focus:ring-brand-100"
          fullWidth
          required
        />
        {prefillEmail && (
          <p className="text-xs text-brand-500">This email is linked to your invitation.</p>
        )}
      </div>

      <div className="space-y-3">
        <label htmlFor="password" className="text-base font-medium text-[#111233]">
          Password
        </label>
        <Input
          id="password"
          name="password"
          placeholder="Create a password"
          type="password"
          autoComplete="new-password"
          className="h-16 rounded-[32px] border-brand-200/70 px-6 text-[17px] font-medium text-[#111233] placeholder:text-[#111233]/55 focus:ring-brand-100"
          fullWidth
          required
        />
      </div>

      <input type="hidden" name="token" value={token} />

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <Button type="submit" className="h-16 rounded-[32px] text-lg font-semibold shadow-none" fullWidth isLoading={isLoading}>
        Create my account
      </Button>

      <p className="text-xs leading-relaxed text-brand-700/70">
        By signing up, you agree to the Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}

export default function EmployeeRegisterPage() {
  return (
    <AuthSplitShell
      title="Join your team"
      description="Your company has invited you to view your compensation details."
      activeNav="register"
      heroImageSrc={AUTH_PUBLIC_HERO_IMAGE_PATH}
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-800 underline underline-offset-4">
            Log in
          </Link>
        </p>
      }
    >
      <Suspense fallback={<div className="py-8 text-center text-sm text-brand-500">Loading...</div>}>
        <EmployeeRegisterForm />
      </Suspense>
    </AuthSplitShell>
  );
}
