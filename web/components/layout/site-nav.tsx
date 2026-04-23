"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import {
  AuthenticatedUserMenuFromModel,
  AuthenticatedUserMenuMobileItems,
  useAuthenticatedUserMenuModel,
} from "@/components/auth/authenticated-user-menu";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

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
          className="h-14 w-auto lg:h-16"
        />
      </Link>
    );
  }

  return <Logo />;
}

export function SiteNav({ variant = "light" }: SiteNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const account = useAuthenticatedUserMenuModel();
  const isDark = variant === "dark";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={clsx(
        "z-50",
        isDark
          ? "relative bg-[#111233] text-white"
          : "sticky top-0 border-b border-border bg-white/95 backdrop-blur-md",
      )}
    >
      <div className="mx-auto w-full max-w-[90rem] p-4 sm:px-10 lg:px-20 lg:py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="shrink-0">
            <NavLogo variant={variant} />
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {account.status === "loading" ? (
              <div aria-busy="true" className="flex">
                <div
                  className={clsx(
                    "flex h-16 w-40 items-center justify-center rounded-[32px]",
                    isDark
                      ? "bg-white/10 ring-1 ring-white/12"
                      : "bg-brand-50 ring-1 ring-brand-100",
                  )}
                >
                  <span className="sr-only">Loading account</span>
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "h-2.5 w-20 rounded-full",
                      isDark ? "bg-white/25" : "bg-brand-200",
                    )}
                  />
                </div>
              </div>
            ) : account.status === "signed_in" ? (
              <AuthenticatedUserMenuFromModel
                variant="marketing"
                dark={isDark}
                model={account}
              />
            ) : (
              <>
                <Link href="/register" className="inline-flex">
                  <Button
                    size="sm"
                    className={clsx(
                      "h-16 rounded-[32px] !px-10 !text-[18px] !font-semibold !tracking-[0.02em]",
                      isDark
                        ? "!bg-[#28e7c5] !text-[#111233] shadow-[0px_4px_16px_0px_rgba(17,18,51,0.25)] hover:!bg-[#28e7c5]/90"
                        : "",
                    )}
                  >
                    Early access
                  </Button>
                </Link>
                <Link href="/login" className="inline-flex">
                  <Button
                    variant={isDark ? "ghost" : "secondary"}
                    size="sm"
                    className={clsx(
                      "h-16 rounded-[32px] !px-10 !text-[18px] !font-semibold !tracking-[0.02em]",
                      isDark
                        ? "!bg-[#111233] !text-white shadow-[0px_4px_16px_0px_rgba(17,18,51,0.25)] hover:!bg-white/10"
                        : "",
                    )}
                  >
                    Log in
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className={clsx(
              "flex h-14 w-14 items-center justify-center rounded-[32px] transition-colors lg:hidden",
              isDark
                ? "bg-[#111233] text-white hover:bg-white/10"
                : "bg-white text-brand-700 ring-1 ring-border hover:bg-muted",
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div
            className={clsx(
              "mt-4 border-t pt-4 lg:hidden",
              isDark ? "border-white/10" : "border-border",
            )}
          >
            <div className="flex flex-col gap-2">
              {account.status === "signed_in" ? (
                <AuthenticatedUserMenuMobileItems model={account} dark={isDark} />
              ) : account.status === "loading" ? (
                <div
                  aria-busy="true"
                  className={clsx(
                    "rounded-[24px] px-4 py-3 text-sm",
                    isDark ? "bg-white/5 text-white/80" : "bg-brand-50 text-brand-700",
                  )}
                >
                  Loading account
                </div>
              ) : (
                <>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className={clsx(
                        "h-14 w-full rounded-[32px] !text-base !font-semibold !tracking-[0.02em]",
                        isDark ? "!bg-[#28e7c5] !text-[#111233]" : "",
                      )}
                    >
                      Early access
                    </Button>
                  </Link>
                  <Link
                    href="/login"
                    className={clsx(
                      "inline-flex h-14 w-full items-center justify-center rounded-[32px] text-base font-semibold tracking-[0.02em] transition-colors",
                      isDark
                        ? "bg-[#111233] text-white ring-1 ring-white/10 hover:bg-white/10"
                        : "bg-white text-brand-700 ring-1 ring-border hover:bg-muted",
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
