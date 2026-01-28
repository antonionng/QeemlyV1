"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthSplitShell, AUTH_IMAGE_PROMPTS } from "@/components/auth/auth-split-shell";
import { login } from "./actions";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // If successful, login action will redirect
  }

  return (
    <AuthSplitShell
      title="Log in"
      description="Enter your credentials to access your dashboard."
      marketingBadge="Compensation intelligence"
      marketingHeadline="Compensation intelligence, localized for the Gulf."
      marketingSubhead="Benchmark roles, validate offers, and forecast salary budgets with confidence, with market data your teams can trust."
      bullets={[
        "Real-time ranges by role, level, and location",
        "Fair-pay signals and trendlines, not spreadsheets",
        "Finance-ready exports and audit-friendly reporting",
      ]}
      heroImagePathHint="/public/auth/hero-login.png"
      heroPrompt={AUTH_IMAGE_PROMPTS.loginHero}
      footer={
        <p>
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-brand-800 underline underline-offset-4">
            Request access
          </Link>
        </p>
      }
    >
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-brand-900">
            Work email
          </label>
          <Input id="email" name="email" placeholder="name@company.com" type="email" autoComplete="email" fullWidth required />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-semibold text-brand-900">
            Password
          </label>
          <Input id="password" name="password" placeholder="Enter your password" type="password" autoComplete="current-password" fullWidth required />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <Button type="submit" fullWidth isLoading={isLoading}>
          Sign in
        </Button>
      </form>
    </AuthSplitShell>
  );
}
