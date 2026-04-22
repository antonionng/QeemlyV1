import type { ReactNode } from "react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const AUTH_IMAGE_PROMPTS = {
  loginHero:
    "Editorial 3D glassmorphism illustration for a B2B data analytics platform, floating translucent cards and modals, subtle charts and grid, soft purple (#5C45FD) and indigo glow lighting, premium minimal aesthetic, high detail, shallow depth of field, no text, clean light background, 16:10 composition.",
  registerHero:
    "Editorial 3D scene of onboarding into a data platform, floating UI panels (profile card, company card, verification modal), soft glass materials, purple brand glow (#5C45FD), minimal clean background, no text, premium SaaS look, 16:10 composition.",
  overlayAssets:
    "Set of 3 transparent-background editorial 3D glass UI modal cards (salary range, forecast, compliance), purple glow accents, no text, clean minimal, consistent lighting, PNG with alpha.",
} as const;

export const AUTH_PUBLIC_HERO_IMAGE_PATH = "/auth/public-auth-hero.png";

type AuthSplitShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  activeNav?: "login" | "register";
  marketingBadge?: string;
  marketingHeadline?: string;
  marketingSubhead?: string;
  bullets?: string[];
  heroImagePathHint?: string;
  heroImageSrc?: string;
  heroPrompt?: string;
  rightFooter?: ReactNode;
};

function normalizePublicAssetPath(path?: string) {
  if (!path) return undefined;
  return path.startsWith("/public/") ? path.replace("/public", "") : path;
}

function AuthNavButton({
  href,
  label,
  active = false,
  variant = "dark",
}: {
  href: string;
  label: string;
  active?: boolean;
  variant?: "dark" | "mint";
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "inline-flex min-h-14 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors sm:px-8",
        variant === "mint"
          ? "bg-[#28e7c5] text-[#111233] hover:bg-[#20d3b4]"
          : active
            ? "bg-[#111233] text-white"
            : "bg-[#111233] text-white hover:bg-[#20245d]",
      )}
    >
      {label}
    </Link>
  );
}

export function AuthSplitShell({
  title,
  description,
  children,
  footer,
  activeNav = "login",
  marketingHeadline,
  heroImagePathHint,
  heroImageSrc,
  heroPrompt: _heroPrompt,
  rightFooter,
}: AuthSplitShellProps) {
  const resolvedHeroImageSrc =
    normalizePublicAssetPath(heroImageSrc) ?? normalizePublicAssetPath(heroImagePathHint) ?? AUTH_PUBLIC_HERO_IMAGE_PATH;

  return (
    <div data-testid="auth-shell" className="min-h-screen bg-white">
      <div className="mx-auto hidden min-h-screen w-full max-w-[1440px] lg:block">
        <header data-testid="auth-top-nav" className="flex h-[112px] items-start justify-between px-20 pt-6">
          <div className="flex h-16 items-center">
            <Logo href="/home" className="shrink-0" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <AuthNavButton href="/register" label="Early access" active={activeNav === "register"} variant="mint" />
            <AuthNavButton href="/login" label="Log in" active={activeNav === "login"} />
          </div>
        </header>

        <main className="relative h-[812px]">
          <section className="absolute left-[84px] top-0 w-[512px]">
            <div
              data-testid="auth-form-panel"
              className="rounded-[24px] bg-white p-10 shadow-[0_20px_60px_rgba(17,18,51,0.08)]"
            >
              <div className="flex flex-col gap-8">
                <div>
                  <h1 className="text-[2rem] font-semibold leading-[1.2] tracking-[-0.03em] text-[#111233]">{title}</h1>
                  {description ? <p className="mt-3 max-w-[24rem] text-sm leading-6 text-brand-700/75">{description}</p> : null}
                </div>
                {children}
              </div>
            </div>
            {footer ? <div className="mt-4 text-sm text-brand-700/80">{footer}</div> : null}
          </section>

          <section
            data-testid="auth-visual-panel"
            className="auth-hero-panel absolute left-[731px] top-0 h-[758px] w-[713px] overflow-hidden rounded-bl-[40px] rounded-tl-[40px] bg-[#111233]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-bl-[40px] rounded-tl-[40px]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 713 758' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(70.755 73.61 -69.083 220.24 0 0)'><stop stop-color='rgba(92,69,253,1)' offset='0'/><stop stop-color='rgba(92,69,253,0)' offset='1'/></radialGradient></defs></svg>\"), linear-gradient(90deg, rgb(17, 18, 51) 0%, rgb(17, 18, 51) 100%)",
              }}
            />
            <div className="absolute inset-0">
              <Image
                src={resolvedHeroImageSrc}
                alt={marketingHeadline ?? `${title} illustration`}
                fill
                priority
                sizes="713px"
                className="object-cover rounded-bl-[40px] rounded-tl-[40px]"
              />
            </div>
            {rightFooter ? <div className="absolute bottom-6 right-6 z-10">{rightFooter}</div> : null}
          </section>
        </main>
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-[34rem] flex-col px-6 py-6 lg:hidden">
        <header data-testid="auth-top-nav" className="flex items-center justify-between gap-4">
          <Logo href="/home" className="shrink-0" />
          <div className="flex items-center gap-2">
            <AuthNavButton href="/register" label="Early access" active={activeNav === "register"} variant="mint" />
            <AuthNavButton href="/login" label="Log in" active={activeNav === "login"} />
          </div>
        </header>

        <section className="mt-10 rounded-[24px] bg-white p-6 shadow-[0_20px_60px_rgba(17,18,51,0.08)]">
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-[2rem] font-semibold leading-[1.2] tracking-[-0.03em] text-[#111233]">{title}</h1>
              {description ? <p className="mt-3 text-sm leading-6 text-brand-700/75">{description}</p> : null}
            </div>
            {children}
          </div>
        </section>

        {footer ? <div className="mt-4 text-sm text-brand-700/80">{footer}</div> : null}

        <section className="auth-hero-panel relative mt-8 overflow-hidden rounded-[32px]">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[32px]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 713 758' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(70.755 73.61 -69.083 220.24 0 0)'><stop stop-color='rgba(92,69,253,1)' offset='0'/><stop stop-color='rgba(92,69,253,0)' offset='1'/></radialGradient></defs></svg>\"), linear-gradient(90deg, rgb(17, 18, 51) 0%, rgb(17, 18, 51) 100%)",
            }}
          />
          <div className="relative min-h-[360px]">
            <Image
              src={resolvedHeroImageSrc}
              alt={marketingHeadline ?? `${title} illustration`}
              fill
              sizes="100vw"
              className="object-cover rounded-[32px]"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

