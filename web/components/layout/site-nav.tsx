"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const navLinks = [
  { href: "/home", label: "Home" },
  {
    label: "Product",
    children: [
      { href: "/search", label: "Benchmark Search", desc: "Real-time salary ranges by role & location" },
      { href: "/analytics", label: "Analytics Dashboard", desc: "Insights, trends, and market intelligence" },
    ],
  },
  {
    label: "Solutions",
    children: [
      { href: "/solutions/hr-teams", label: "For HR Teams", desc: "Build fair compensation frameworks" },
      { href: "/solutions/founders", label: "For Founders", desc: "Hire confidently, optimize burn" },
      { href: "/solutions/finance", label: "For Finance", desc: "Forecast salary budgets accurately" },
    ],
  },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openDropdown) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setOpenDropdown(null);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenDropdown(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openDropdown]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Logo */}
          <div className="shrink-0">
            <Logo />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              if (link.children) {
                const isOpen = openDropdown === link.label;
                return (
                  <div
                    key={link.label}
                    className="relative"
                    ref={isOpen ? dropdownRef : undefined}
                  >
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={isOpen}
                      className={clsx(
                        "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isOpen ? "bg-brand-50 text-brand-800" : "text-brand-700 hover:bg-muted hover:text-brand-900"
                      )}
                      onClick={() => setOpenDropdown(isOpen ? null : link.label)}
                      onMouseEnter={() => setOpenDropdown(link.label)}
                    >
                      {link.label}
                      <ChevronDown className={clsx("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div
                        className="absolute left-0 top-full z-50 w-72 pt-1"
                        onMouseEnter={() => setOpenDropdown(link.label)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        <div className="rounded-xl border border-border bg-white p-2 shadow-lg">
                          {link.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="block rounded-lg px-4 py-3 transition-colors hover:bg-muted"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <div className="text-sm font-semibold text-brand-900">{child.label}</div>
                              <div className="text-xs text-brand-600">{child.desc}</div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-brand-50 text-brand-800" : "text-brand-700 hover:bg-muted hover:text-brand-900"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-muted hover:text-brand-900 sm:inline-flex"
            >
              Log in
            </Link>
            <Link href="/register" className="hidden sm:inline-flex">
              <Button size="sm">Get Started</Button>
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-700 hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="border-t border-border py-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                if (link.children) {
                  return (
                    <div key={link.label} className="space-y-1">
                      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-brand-500">
                        {link.label}
                      </div>
                      {link.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="block rounded-lg px-4 py-2 text-sm text-brand-700 hover:bg-muted"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-muted">
                Log in
              </Link>
              <Link href="/register">
                <Button size="sm" className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
