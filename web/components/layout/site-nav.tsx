"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/home", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

type SiteNavProps = {
  variant?: "light" | "dark";
};

function NavLogo({ variant }: { variant: "light" | "dark" }) {
  if (variant === "dark") {
    return (
      <Link href="/home" className="inline-flex items-center">
        <Image
          src="/images/marketing/home/logo-white.svg"
          alt="Qeemly"
          width={163}
          height={64}
          priority
          unoptimized
          className="h-12 w-auto lg:h-16"
        />
      </Link>
    );
  }

  return <Logo />;
}

export function SiteNav({ variant = "light" }: SiteNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isDark = variant === "dark";

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setIsAuthenticated(Boolean(user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={clsx(
        "z-50",
        isDark ? "relative bg-[#111233] text-white" : "sticky top-0 border-b border-border bg-white/95 backdrop-blur-md",
      )}
    >
      <div className="mx-auto w-full max-w-[90rem] px-6 sm:px-10 lg:px-20">
        <div className="grid h-28 grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-6">
          <div className="shrink-0">
            <NavLogo variant={variant} />
          </div>

          <nav className="hidden items-center justify-center gap-px lg:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "inline-flex items-center justify-center rounded-[32px] px-6 py-5 text-[16px] leading-none tracking-[0.02em] transition-colors",
                    isDark
                      ? active
                        ? "bg-[rgba(92,69,253,0.2)] font-semibold text-white"
                        : "font-medium text-white/88 hover:bg-white/5 hover:text-white"
                      : active
                        ? "bg-brand-50 font-semibold text-brand-800"
                        : "font-medium text-brand-700 hover:bg-muted hover:text-brand-900",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard" className="hidden sm:inline-flex">
                <Button
                  size="sm"
                  className={clsx(
                    "h-14 rounded-full px-8 text-[16px] font-semibold tracking-[0.02em]",
                    isDark
                      ? "!bg-[#28e7c5] !text-[#111233] shadow-[0_4px_16px_rgba(17,18,51,0.25)]"
                      : "",
                  )}
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register" className="hidden sm:inline-flex">
                  <Button
                    size="sm"
                    className={clsx(
                      "h-14 rounded-full !px-8 !text-[16px] !font-semibold !tracking-[0.02em]",
                      isDark
                        ? "!bg-[#28e7c5] !text-[#111233] shadow-[0_4px_16px_rgba(17,18,51,0.25)]"
                        : "",
                    )}
                  >
                    Early access
                  </Button>
                </Link>
                <Link href="/login" className="hidden sm:inline-flex">
                  <Button
                    variant={isDark ? "ghost" : "secondary"}
                    size="sm"
                    className={clsx(
                      "h-14 rounded-full !px-8 !text-[16px] !font-semibold !tracking-[0.02em]",
                      isDark
                        ? "!bg-[#111233] !text-white ring-1 ring-white/10 shadow-[0_4px_16px_rgba(17,18,51,0.25)] hover:!bg-white/10"
                        : "",
                    )}
                  >
                    Log in
                  </Button>
                </Link>
              </>
            )}

            <button
              type="button"
              className={clsx(
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors lg:hidden",
                isDark ? "text-white hover:bg-white/10" : "text-brand-700 hover:bg-muted",
              )}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            className={clsx(
              "border-t py-4 lg:hidden",
              isDark ? "border-white/10" : "border-border",
            )}
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "rounded-[24px] px-4 py-3 text-sm font-medium transition-colors",
                    isDark
                      ? pathname === link.href
                        ? "bg-[rgba(92,69,253,0.2)] text-white"
                        : "text-white/88 hover:bg-white/5 hover:text-white"
                      : pathname === link.href
                        ? "bg-brand-50 text-brand-800"
                        : "text-brand-700 hover:bg-muted hover:text-brand-900",
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div
              className={clsx(
                "mt-4 flex flex-col gap-2 border-t pt-4",
                isDark ? "border-white/10" : "border-border",
              )}
            >
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button
                    size="sm"
                    className={clsx(
                      "h-12 w-full rounded-full text-sm font-semibold",
                      isDark ? "!bg-[#28e7c5] !text-[#111233]" : "",
                    )}
                  >
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className={clsx(
                        "h-12 w-full rounded-full text-sm font-semibold",
                        isDark ? "!bg-[#28e7c5] !text-[#111233]" : "",
                      )}
                    >
                      Early access
                    </Button>
                  </Link>
                  <Link
                    href="/login"
                    className={clsx(
                      "inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition-colors",
                      isDark ? "bg-[#111233] text-white ring-1 ring-white/10 hover:bg-white/10" : "text-brand-700 hover:bg-muted",
                    )}
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
