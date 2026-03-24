"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthSplitShell, AUTH_PUBLIC_HERO_IMAGE_PATH } from "@/components/auth/auth-split-shell";
import { signup } from "../login/actions";

function InlineLegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-brand-800 underline underline-offset-4">
      {children}
    </Link>
  );
}

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

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSubmit(new FormData(event.currentTarget));
  }

  return (
    <AuthSplitShell
      title="Create account"
      description="Tell us a bit about you to get started."
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
            className="h-16 rounded-[32px] border-brand-200/70 px-6 text-[17px] font-medium text-[#111233] placeholder:text-[#111233]/55 focus:ring-brand-100"
            fullWidth
            required
          />
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

        <div className="space-y-3">
          <label htmlFor="company" className="text-base font-medium text-[#111233]">
            Company
          </label>
          <Input
            id="company"
            name="company"
            placeholder="Company name"
            autoComplete="organization"
            className="h-16 rounded-[32px] border-brand-200/70 px-6 text-[17px] font-medium text-[#111233] placeholder:text-[#111233]/55 focus:ring-brand-100"
            fullWidth
            required
          />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <Button type="submit" className="h-16 rounded-[32px] text-lg font-semibold shadow-none" fullWidth isLoading={isLoading}>
          Create account
        </Button>

        <p className="text-xs leading-relaxed text-brand-700/70">
          By signing up, you agree to our <InlineLegalLink href="/terms">Terms of Service</InlineLegalLink> and{" "}
          <InlineLegalLink href="/privacy">Privacy Policy</InlineLegalLink>.
        </p>
      </form>
    </AuthSplitShell>
  );
}
