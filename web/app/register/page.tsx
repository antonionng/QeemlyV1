import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthSplitShell, AUTH_IMAGE_PROMPTS } from "@/components/auth/auth-split-shell";

export default function RegisterPage() {
  return (
    <AuthSplitShell
      title="Request access"
      description="Tell us a bit about you. We’ll reach out with next steps."
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
          Already onboarded?{" "}
          <Link href="/login" className="font-semibold text-brand-800 underline underline-offset-4">
            Log in
          </Link>
        </p>
      }
    >
      <form className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-semibold text-brand-900">
            Full name
          </label>
          <Input id="name" name="name" placeholder="Your name" autoComplete="name" fullWidth />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-brand-900">
            Work email
          </label>
          <Input id="email" name="email" placeholder="name@company.com" type="email" autoComplete="email" fullWidth />
        </div>

        <div className="space-y-2">
          <label htmlFor="company" className="text-sm font-semibold text-brand-900">
            Company
          </label>
          <Input id="company" name="company" placeholder="Company name" autoComplete="organization" fullWidth />
        </div>

        <Button type="submit" fullWidth>
          Request access
        </Button>

        <p className="text-xs leading-relaxed text-brand-700/70">
          We’ll only use your details to evaluate access and set up your workspace.
        </p>
      </form>
    </AuthSplitShell>
  );
}





