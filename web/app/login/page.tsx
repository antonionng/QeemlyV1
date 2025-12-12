import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthSplitShell, AUTH_IMAGE_PROMPTS } from "@/components/auth/auth-split-shell";

export default function LoginPage() {
  return (
    <AuthSplitShell
      title="Log in"
      description="Enter your work email and we’ll send you a secure sign-in link."
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
          Don’t have an account?{" "}
          <Link href="/register" className="font-semibold text-brand-800 underline underline-offset-4">
            Request access
          </Link>
        </p>
      }
    >
      <form className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-brand-900">
            Work email
          </label>
          <Input id="email" name="email" placeholder="name@company.com" type="email" autoComplete="email" fullWidth />
        </div>

        <Button type="submit" fullWidth>
          Continue
        </Button>

        <p className="text-xs leading-relaxed text-brand-700/70">
          We’ll email you a secure link. No passwords to remember.
        </p>
      </form>
    </AuthSplitShell>
  );
}


