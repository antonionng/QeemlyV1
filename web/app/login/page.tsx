"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthSplitShell, AUTH_PUBLIC_HERO_IMAGE_PATH } from "@/components/auth/auth-split-shell";
import { login } from "./actions";
import { parseClientError } from "@/lib/errors/client-safe";

function mapLoginError(errorCode: string | null): string | null {
  switch (errorCode) {
    case "invalid_invite":
      return "This invite link is invalid. Ask your workspace admin for a new invitation.";
    case "invite_expired":
      return "This invite link has expired or has already been used. Ask your workspace admin to resend it.";
    case "invite_accept_failed":
      return "We could not finish linking that invitation to your account. Please ask your workspace admin for help.";
    case "invite_wrong_workspace":
      return "This invitation belongs to a different workspace than your current account. Ask your workspace admin for help.";
    case "auth_callback_failed":
      return "We could not complete sign-in. Please try again from the login page.";
    case "forbidden":
      return "Your account is not allowed to access the admin area.";
    default:
      return null;
  }
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const queryError = useMemo(() => mapLoginError(searchParams.get("error")), [searchParams]);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    const result = await login(formData);
    if (result?.error) {
      const parsed = parseClientError(result);
      setError(parsed.message);
      setFieldErrors(parsed.fields ?? {});
      setIsLoading(false);
    }
    // If successful, login action will redirect
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSubmit(new FormData(event.currentTarget));
  }

  return (
    <AuthSplitShell
      title="Log In"
      description="Welcome back. Pick up where you left off and keep your team's pay decisions on track."
      activeNav="login"
      heroImageSrc={AUTH_PUBLIC_HERO_IMAGE_PATH}
      footer={
        <p>
          New to Qeemly?{" "}
          <Link href="/register" className="font-semibold text-brand-800 underline underline-offset-4">
            Request early access
          </Link>
        </p>
      }
    >
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="email" className="text-base font-medium text-[#111233]">
            Email
          </label>
          <Input
            id="email"
            name="email"
            placeholder="Example@eg.com"
            type="email"
            autoComplete="email"
            className="h-16 rounded-[32px] border-brand-200/70 px-6 text-[17px] font-medium text-[#111233] placeholder:text-[#111233]/55 focus:ring-brand-100"
            fullWidth
            required
          />
          {fieldErrors.email && <p className="text-sm font-medium text-red-600">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-base font-medium text-[#111233]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-brand-800 underline underline-offset-4 hover:text-brand-700"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            placeholder="---------"
            type="password"
            autoComplete="current-password"
            className="h-16 rounded-[32px] border-brand-200/70 px-6 text-[17px] font-medium text-[#111233] placeholder:text-[#111233]/55 focus:ring-brand-100"
            fullWidth
            required
          />
          {fieldErrors.password && <p className="text-sm font-medium text-red-600">{fieldErrors.password}</p>}
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-brand-800">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="h-4 w-4 rounded border-brand-200 text-brand-700 focus:ring-brand-200"
          />
          Keep me signed in on this device
        </label>

        {(error || queryError) && <p className="text-sm font-medium text-red-600">{error || queryError}</p>}

        <Button type="submit" className="h-16 rounded-[32px] text-lg font-semibold shadow-none" fullWidth isLoading={isLoading}>
          Sign in
        </Button>

        <p className="text-xs leading-relaxed text-brand-700/70">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="font-semibold text-brand-800 underline underline-offset-4">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-brand-800 underline underline-offset-4">
            Privacy Policy
          </Link>
          . Protected by industry-standard encryption.
        </p>
      </form>
    </AuthSplitShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
