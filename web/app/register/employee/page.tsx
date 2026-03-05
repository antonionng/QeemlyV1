"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthSplitShell, AUTH_IMAGE_PROMPTS } from "@/components/auth/auth-split-shell";
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
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-semibold text-brand-900">
          Full name
        </label>
        <Input id="name" name="name" placeholder="Your name" autoComplete="name" fullWidth required />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-brand-900">
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
          fullWidth
          required
        />
        {prefillEmail && (
          <p className="text-xs text-brand-500">This email is linked to your invitation.</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-brand-900">
          Password
        </label>
        <Input
          id="password"
          name="password"
          placeholder="Create a password"
          type="password"
          autoComplete="new-password"
          fullWidth
          required
        />
      </div>

      <input type="hidden" name="token" value={token} />

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <Button type="submit" fullWidth isLoading={isLoading}>
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
      marketingBadge="Employee Portal"
      marketingHeadline="Your compensation, clearly explained."
      marketingSubhead="See your salary, bonus, equity, and growth history in one place."
      bullets={[
        "View your total compensation breakdown",
        "Track your salary growth over time",
        "Understand where you sit within your salary band",
      ]}
      heroImagePathHint="/public/auth/hero-register.png"
      heroPrompt={AUTH_IMAGE_PROMPTS.registerHero}
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
