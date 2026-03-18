"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthSplitShell, AUTH_PUBLIC_HERO_IMAGE_PATH } from "@/components/auth/auth-split-shell";
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

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSubmit(new FormData(event.currentTarget));
  }

  return (
    <AuthSplitShell
      title="Log In"
      activeNav="login"
      heroImageSrc={AUTH_PUBLIC_HERO_IMAGE_PATH}
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
        </div>

        <div className="space-y-3">
          <label htmlFor="password" className="text-base font-medium text-[#111233]">
            Password
          </label>
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
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <Button type="submit" className="h-16 rounded-[32px] text-lg font-semibold shadow-none" fullWidth isLoading={isLoading}>
          Sign in
        </Button>
      </form>
    </AuthSplitShell>
  );
}
