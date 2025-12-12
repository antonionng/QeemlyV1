import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";

export const AUTH_IMAGE_PROMPTS = {
  loginHero:
    "Editorial 3D glassmorphism illustration for a B2B data analytics platform, floating translucent cards and modals, subtle charts and grid, soft purple (#5C45FD) and indigo glow lighting, premium minimal aesthetic, high detail, shallow depth of field, no text, clean light background, 16:10 composition.",
  registerHero:
    "Editorial 3D scene of onboarding into a data platform, floating UI panels (profile card, company card, verification modal), soft glass materials, purple brand glow (#5C45FD), minimal clean background, no text, premium SaaS look, 16:10 composition.",
  overlayAssets:
    "Set of 3 transparent-background editorial 3D glass UI modal cards (salary range, forecast, compliance), purple glow accents, no text, clean minimal, consistent lighting, PNG with alpha.",
} as const;

type OverlayCard = {
  eyebrow?: string;
  title: string;
  value?: string;
  meta?: string;
  tone?: "brand" | "muted" | "ghost";
};

type AuthSplitShellProps = {
  /** Left panel */
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Optional link under logo (e.g. “Back to site”) */
  topLinkHref?: string;
  topLinkLabel?: string;

  /** Right panel */
  marketingBadge?: string;
  marketingHeadline: string;
  marketingSubhead: string;
  bullets: string[];
  heroImagePathHint: string;
  heroPrompt?: string;
  overlayCards?: [OverlayCard, OverlayCard, OverlayCard];

  /** Optional extra right-panel content (e.g. trust logos) */
  rightFooter?: ReactNode;
};

function OverlayMiniChart() {
  return (
    <div className="mt-2 flex items-end gap-1.5">
      <div className="h-3 w-1.5 rounded-full bg-brand-200" />
      <div className="h-5 w-1.5 rounded-full bg-brand-300" />
      <div className="h-4 w-1.5 rounded-full bg-brand-200" />
      <div className="h-7 w-1.5 rounded-full bg-brand-400/80" />
      <div className="h-6 w-1.5 rounded-full bg-brand-300" />
      <div className="h-8 w-1.5 rounded-full bg-brand-500/80" />
    </div>
  );
}

function OverlayCardUI({ eyebrow, title, value, meta, tone = "ghost" }: OverlayCard) {
  const badgeVariant = tone === "brand" ? "brand" : tone === "muted" ? "muted" : "ghost";
  return (
    <div className="rounded-2xl bg-white/65 p-4 shadow-[0_18px_50px_rgba(15,15,26,0.10)] ring-1 ring-border/60 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-600/90">{eyebrow}</div>
          ) : null}
          <div className="mt-1 text-sm font-semibold text-brand-900">{title}</div>
        </div>
        <Badge variant={badgeVariant} className="shrink-0 whitespace-nowrap">
          {tone === "brand" ? "Live" : tone === "muted" ? "Verified" : "Preview"}
        </Badge>
      </div>
      {value ? <div className="mt-2 text-xl font-semibold text-brand-900">{value}</div> : null}
      {meta ? <div className="mt-1 text-xs text-brand-700/75">{meta}</div> : null}
      <OverlayMiniChart />
    </div>
  );
}

function HeroPlaceholder({ pathHint, prompt }: { pathHint: string; prompt?: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/55 ring-1 ring-border/60 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(650px_circle_at_20%_25%,rgba(92,69,253,0.20),transparent_55%),radial-gradient(700px_circle_at_80%_30%,rgba(167,139,250,0.22),transparent_60%)]" />
      <div className="relative flex min-h-[260px] flex-col items-center justify-center p-6 text-center">
        <div className="rounded-2xl border border-dashed border-border/80 bg-white/55 px-5 py-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-600/90">Hero image placeholder</div>
          <div className="mt-2 text-sm font-semibold text-brand-900">
            Drop an image at <span className="font-mono text-[13px]">{pathHint}</span>
          </div>
          <div className="mt-1 text-xs text-brand-700/70">Recommended: 16:10 PNG/WebP, no text.</div>
        </div>
        {prompt ? (
          <div className="mt-4 max-w-[520px] text-xs text-brand-700/70">
            <span className="font-semibold text-brand-800">Prompt:</span> {prompt}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AuthSplitShell({
  title,
  description,
  children,
  footer,
  topLinkHref = "/home",
  topLinkLabel = "Back to home",
  marketingBadge = "Qeemly Platform",
  marketingHeadline,
  marketingSubhead,
  bullets,
  heroImagePathHint,
  heroPrompt,
  overlayCards,
  rightFooter,
}: AuthSplitShellProps) {
  const overlays: [OverlayCard, OverlayCard, OverlayCard] =
    overlayCards ??
    ([
      {
        eyebrow: "Salary range",
        title: "Senior Product Designer",
        value: "AED 32k–48k",
        meta: "P50–P90 • Dubai • Updated today",
        tone: "brand",
      },
      {
        eyebrow: "Offer check",
        title: "Within band",
        value: "+3.2%",
        meta: "Fair-pay signal: strong",
        tone: "muted",
      },
      {
        eyebrow: "Budget forecast",
        title: "Headcount plan",
        value: "AED 3.1M",
        meta: "Next 2 quarters • Scenario A",
        tone: "ghost",
      },
    ] as [OverlayCard, OverlayCard, OverlayCard]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 lg:grid-cols-2">
        {/* Left / Form */}
        <div className="flex flex-col px-6 py-10 sm:px-10 lg:px-12">
          <div className="flex items-center justify-between gap-4">
            <Logo href="/home" className="shrink-0" />
            <Link
              href={topLinkHref}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-muted hover:text-brand-900"
            >
              {topLinkLabel}
            </Link>
          </div>

          <div className="mt-10 flex flex-1 flex-col justify-center">
            <div className="max-w-md">
              <h1 className="text-3xl font-semibold tracking-tight text-brand-900">{title}</h1>
              {description ? <p className="mt-2 text-sm leading-relaxed text-brand-700/80">{description}</p> : null}

              <div className="mt-6 rounded-3xl border border-border bg-white p-6 shadow-sm">
                {children}
              </div>

              {footer ? <div className="mt-5 text-sm text-brand-700/80">{footer}</div> : null}
            </div>
          </div>

          <div className="mt-10 text-xs text-brand-700/60">
            © {new Date().getFullYear()} Qeemly. All rights reserved.
          </div>
        </div>

        {/* Right / Marketing */}
        <div className="auth-hero-panel relative hidden overflow-hidden border-l border-border/70 bg-white/60 px-10 py-10 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 auth-hero-grid" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 auth-hero-glow" aria-hidden="true" />

          <div className="relative">
            <Badge variant="ghost" className="bg-white/70 backdrop-blur">
              {marketingBadge}
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-brand-900">{marketingHeadline}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-700/80">{marketingSubhead}</p>

            <ul className="mt-6 space-y-3 text-sm text-brand-800/90">
              {bullets.slice(0, 3).map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500/80" />
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-10">
            <HeroPlaceholder pathHint={heroImagePathHint} prompt={heroPrompt} />

            {/* Floating “modal” overlays */}
            <div className="pointer-events-none absolute -left-6 -top-8 w-[320px] rotate-[-5deg]">
              <OverlayCardUI {...overlays[0]} />
            </div>
            <div className="pointer-events-none absolute -right-8 top-10 w-[300px] rotate-[6deg]">
              <OverlayCardUI {...overlays[1]} />
            </div>
            <div className="pointer-events-none absolute left-10 -bottom-10 w-[320px] rotate-[2deg]">
              <OverlayCardUI {...overlays[2]} />
            </div>
          </div>

          {rightFooter ? <div className="relative mt-10">{rightFooter}</div> : <div className="relative" />}
        </div>

        {/* Mobile marketing (condensed) */}
        <div className="auth-hero-panel relative border-t border-border/70 bg-white/60 px-6 py-10 lg:hidden">
          <div className="pointer-events-none absolute inset-0 auth-hero-grid" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 auth-hero-glow" aria-hidden="true" />

          <div className="relative mx-auto max-w-md">
            <Badge variant="ghost" className="bg-white/70 backdrop-blur">
              {marketingBadge}
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-brand-900">{marketingHeadline}</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-700/80">{marketingSubhead}</p>

            <div className="mt-6">
              <HeroPlaceholder pathHint={heroImagePathHint} prompt={heroPrompt} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



