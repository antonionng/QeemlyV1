"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthSplitShell, AUTH_IMAGE_PROMPTS } from "@/components/auth/auth-split-shell";
import { signup } from "../login/actions";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // If successful, signup action will redirect
  }

  return (
    <AuthSplitShell
      title="Create account"
      description="Tell us a bit about you to get started."
      marketingBadge="Built for teams"
      marketingHeadline="Move faster with confident offers and fair bands."
      marketingSubhead="Qeemly helps HR, founders, and finance teams align comp, reduce negotiation churn, and plan budgets with clarity."
      bullets={[
        "Gulf-localized benchmarks you can explain and defend",
        "Scenario planning for hires, promotions, and team growth",
        "Audit-friendly reporting for internal equity and compliance",
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
          <Input id="email" name="email" placeholder="name@company.com" type="email" autoComplete="email" fullWidth required />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-semibold text-brand-900">
            Password
          </label>
          <Input id="password" name="password" placeholder="Create a password" type="password" autoComplete="new-password" fullWidth required />
        </div>

        <div className="space-y-2">
          <label htmlFor="company" className="text-sm font-semibold text-brand-900">
            Company
          </label>
          <Input id="company" name="company" placeholder="Company name" autoComplete="organization" fullWidth required />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <Button type="submit" fullWidth isLoading={isLoading}>
          Create account
        </Button>

        <p className="text-xs leading-relaxed text-brand-700/70">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthSplitShell>
  );
}
