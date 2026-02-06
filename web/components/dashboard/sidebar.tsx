"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  ChartLine,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Globe2,
  Home,
  LogOut,
  Settings,
  ShieldCheck,
  Upload,
  User,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { useCompanySettings, getCompanyInitials } from "@/lib/company";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

type NavSection = {
  label: string | null;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: null,
    items: [
      { href: "/dashboard/overview", label: "Company Overview", icon: Building2 },
      { href: "/dashboard/benchmarks", label: "Benchmarks", icon: ChartLine },
      { href: "/dashboard/salary-review", label: "Salary Review", icon: DollarSign },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
      { href: "/dashboard/compliance", label: "Compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/dashboard/relocation", label: "CoL Calculator", icon: Globe2 },
      { href: "/dashboard/upload", label: "Upload Data", icon: Upload },
    ],
  },
];

const bottomItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

type DashboardSidebarProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
};

function isActiveRoute(pathname: string, href: string) {
  // Company Overview is active for both /dashboard and /dashboard/overview
  if (href === "/dashboard/overview") {
    return pathname === "/dashboard" || pathname === "/dashboard/overview";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type UserData = {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export function DashboardSidebar({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const companySettings = useCompanySettings();

  // Get company initials for collapsed state
  const companyInitials = getCompanyInitials(companySettings.companyName);
  const hasCompanyLogo = !!companySettings.companyLogo;
  const isCompanyConfigured = companySettings.isConfigured;

  useEffect(() => {
    const supabase = createClient();

    async function fetchUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Try to get profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", authUser.id)
          .single();

        setUser({
          email: authUser.email || "",
          fullName: profile?.full_name || null,
          avatarUrl: profile?.avatar_url || null,
        });
      }
    }

    fetchUser();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Get display name and initials
  const displayName = user?.fullName || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-col">
      {/* Logo + collapse toggle */}
      <div
        className={clsx(
          "flex h-16 shrink-0 items-center border-b border-border/50",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {collapsed ? (
          <Link href="/dashboard" className="flex items-center justify-center">
            {hasCompanyLogo ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-border overflow-hidden">
                <img 
                  src={companySettings.companyLogo!} 
                  alt={companySettings.companyName}
                  className="h-full w-full object-contain p-1"
                />
              </div>
            ) : isCompanyConfigured ? (
              <div 
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-sm"
                style={{ backgroundColor: companySettings.primaryColor }}
              >
                {companyInitials}
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white font-bold text-sm">
                Q
              </div>
            )}
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            {hasCompanyLogo ? (
              <>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-border overflow-hidden">
                  <img 
                    src={companySettings.companyLogo!} 
                    alt={companySettings.companyName}
                    className="h-full w-full object-contain p-1"
                  />
                </div>
                <span className="font-semibold text-brand-900 text-sm truncate max-w-[120px]">
                  {companySettings.companyName}
                </span>
              </>
            ) : isCompanyConfigured ? (
              <>
                <div 
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-sm shadow-sm"
                  style={{ backgroundColor: companySettings.primaryColor }}
                >
                  {companyInitials}
                </div>
                <span className="font-semibold text-brand-900 text-sm truncate max-w-[120px]">
                  {companySettings.companyName}
                </span>
              </>
            ) : (
              <Logo compact />
            )}
          </Link>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={clsx(
              "hidden h-8 w-8 items-center justify-center rounded-lg text-brand-700 transition-colors hover:bg-brand-100/70 lg:flex",
              collapsed && "absolute right-2 top-4"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Main navigation */}
      <nav className={clsx("flex-1 overflow-y-auto px-3 py-4", collapsed && "px-2")}>
        <div className={clsx("flex flex-col gap-1", collapsed && "items-center")}>
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={clsx(sectionIndex > 0 && "mt-4")}>
              {/* Section Label */}
              {section.label && !collapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-accent-400">
                  {section.label}
                </p>
              )}
              {section.label && collapsed && (
                <div className="mb-2 h-px w-6 bg-brand-200" />
              )}

              {/* Section Items */}
              <div className={clsx("flex flex-col gap-1", collapsed && "items-center")}>
                {section.items.map((item) => {
                  const active = isActiveRoute(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      className={clsx(
                        "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150",
                        collapsed ? "h-11 w-11 justify-center" : "px-3 py-2.5",
                        active
                          ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                          : "text-brand-800/80 hover:bg-brand-100/70 hover:text-brand-900"
                      )}
                    >
                      <Icon className={clsx("h-[18px] w-[18px] shrink-0", collapsed && "h-5 w-5")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom section */}
      <div className={clsx("shrink-0 border-t border-border/50 px-3 py-3", collapsed && "px-2")}>
        {/* Settings */}
        <div className={clsx("flex flex-col gap-1", collapsed && "items-center")}>
          {bottomItems.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={clsx(
                  "group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150",
                  collapsed ? "h-11 w-11 justify-center" : "px-3 py-2.5",
                  active
                    ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                    : "text-brand-800/80 hover:bg-brand-100/70 hover:text-brand-900"
                )}
              >
                <Icon className={clsx("h-[18px] w-[18px] shrink-0", collapsed && "h-5 w-5")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* User section */}
        <div
          className={clsx(
            "mt-3 flex items-center gap-3 rounded-xl border border-border/60 bg-brand-50/50 transition-colors hover:bg-brand-100/50",
            collapsed ? "justify-center p-2" : "p-2.5"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-white font-semibold text-sm overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : user ? (
              initials
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-brand-900">
                {displayName}
              </div>
              <div className="truncate text-xs text-brand-700/70">
                {user?.email || "Loading..."}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-700/70 transition-colors hover:bg-brand-200/50 hover:text-brand-800"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
