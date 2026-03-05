"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  ChartLine,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  DollarSign,
  Globe2,
  LayoutDashboard,
  LogOut,
  Plug,
  Settings,
  ShieldCheck,
  Upload,
  User,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { useCompanySettings, getCompanyInitials } from "@/lib/company";
import { isFeatureEnabled, type FeatureKey } from "@/lib/release/ga-scope";
import { WorkspaceSwitcher } from "./workspace-switcher";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  featureKey?: FeatureKey;
};

type NavSection = {
  label: string | null;
  items: NavItem[];
};

const adminNavSections: NavSection[] = [
  {
    label: null,
    items: [
      { href: "/dashboard/overview", label: "Company Overview", icon: LayoutDashboard },
      { href: "/dashboard/benchmarks", label: "Benchmarking", icon: ChartLine },
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
      { href: "/dashboard/integrations", label: "Integrations", icon: Plug, featureKey: "integrations" },
      { href: "/dashboard/data/runs", label: "Data Runs", icon: Database },
    ],
  },
];

const employeeNavSections: NavSection[] = [
  {
    label: null,
    items: [
      { href: "/dashboard/me", label: "My Compensation", icon: Wallet },
      { href: "/dashboard/me/history", label: "My History", icon: Clock },
      { href: "/dashboard/me/profile", label: "My Profile", icon: User },
    ],
  },
];

const adminBottomItems: NavItem[] = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

type DashboardSidebarProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
};

function isActiveRoute(pathname: string, href: string) {
  if (href === "/dashboard/overview") {
    return pathname === "/dashboard" || pathname === "/dashboard/overview";
  }
  // Exact match for /dashboard/me so sub-routes don't highlight parent
  if (href === "/dashboard/me") {
    return pathname === "/dashboard/me";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isNavItemEnabled(item: NavItem): boolean {
  if (!item.featureKey) return true;
  return isFeatureEnabled(item.featureKey);
}

type UserData = {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
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

  const companyInitials = getCompanyInitials(companySettings.companyName);
  const hasCompanyLogo = !!companySettings.companyLogo;
  const isCompanyConfigured = companySettings.isConfigured;

  const isEmployee = user?.role === "employee";
  const navSections = isEmployee ? employeeNavSections : adminNavSections;
  const bottomItems = isEmployee ? [] : adminBottomItems;

  // Load user profile
  useEffect(() => {
    const supabase = createClient();

    async function fetchUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, role")
          .eq("id", authUser.id)
          .single();

        setUser({
          email: authUser.email || "",
          fullName: profile?.full_name || null,
          avatarUrl: profile?.avatar_url || null,
          role: profile?.role || "member",
        });
      }
    }

    fetchUser();
  }, []);

  // Load company settings from API and sync to Zustand (for sidebar display)
  useEffect(() => {
    async function loadCompanySettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        
        const data = await res.json();
        const s = data.settings;
        
        // Only update if we have real data from DB
        if (s.company_name || data.workspace_name) {
          companySettings.updateSettings({
            companyName: s.company_name || data.workspace_name || "",
            companyLogo: s.company_logo || "",
            companyWebsite: s.company_website || "",
            companyDescription: s.company_description || "",
            primaryColor: s.primary_color || "#5C45FD",
            industry: s.industry || "",
            companySize: s.company_size || "",
            fundingStage: s.funding_stage || "seed",
            headquartersCountry: s.headquarters_country || "AE",
            headquartersCity: s.headquarters_city || "",
            targetPercentile: s.target_percentile || 50,
            reviewCycle: s.review_cycle || "annual",
            defaultCurrency: s.default_currency || "AED",
            fiscalYearStart: s.fiscal_year_start || 1,
            defaultBonusPercentage: Number(s.default_bonus_percentage) || 15,
            equityVestingSchedule: s.equity_vesting_schedule || "4-year-1-cliff",
            benefitsTier: s.benefits_tier || "standard",
          });
          if (s.is_configured) {
            companySettings.markAsConfigured();
          }
        }
      } catch {
        // Ignore errors - will use Zustand defaults
      }
    }

    loadCompanySettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* Logo + collapse toggle (reference: Qeemly branding, expand/collapse affordance) */}
      <div
        className={clsx(
          "relative flex h-14 shrink-0 items-center border-b border-border/50",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {collapsed ? (
          <Link href="/dashboard" className="flex items-center justify-center w-8 h-8">
            {hasCompanyLogo ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-border overflow-hidden">
                <img 
                  src={companySettings.companyLogo!} 
                  alt={companySettings.companyName}
                  className="h-full w-full object-contain p-1"
                />
              </div>
            ) : isCompanyConfigured ? (
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white font-bold text-xs"
                style={{ backgroundColor: companySettings.primaryColor }}
              >
                {companyInitials}
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white font-bold text-xs">
                Q
              </div>
            )}
          </Link>
        ) : (
          <div className="flex flex-1 min-w-0 items-center justify-between gap-2">
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              {hasCompanyLogo ? (
                <>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-border overflow-hidden">
                    <img 
                      src={companySettings.companyLogo!} 
                      alt={companySettings.companyName}
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                  <span className="truncate text-sm font-semibold text-text-primary">
                    {companySettings.companyName}
                  </span>
                </>
              ) : isCompanyConfigured ? (
                <>
                  <div 
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs"
                    style={{ backgroundColor: companySettings.primaryColor }}
                  >
                    {companyInitials}
                  </div>
                  <span className="truncate text-sm font-semibold text-text-primary">
                    {companySettings.companyName}
                  </span>
                </>
              ) : (
                <Logo compact href={null} />
              )}
            </Link>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text-secondary lg:flex"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        {onToggleCollapse && collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="absolute -right-1 top-1/2 z-10 hidden h-8 w-8 shrink-0 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-surface-1 text-text-tertiary shadow-sm transition-colors hover:bg-surface-3 hover:text-text-secondary lg:flex"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Workspace Switcher (Super Admins only) */}
      <div className={clsx("shrink-0 px-3 py-2 border-b border-border/50", collapsed && "px-2")}>
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      {/* Main navigation */}
      <nav className={clsx("flex-1 overflow-y-auto px-3 py-4", collapsed && "px-2")}>
        <div className={clsx("flex flex-col gap-1", collapsed && "items-center")}>
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={clsx(sectionIndex > 0 && "mt-4")}>
              {/* Section Label (reference: uppercase, light grey) */}
              {section.label && !collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  {section.label}
                </p>
              )}
              {section.label && collapsed && (
                <div className="mx-auto mb-1.5 h-px w-5 bg-border" aria-hidden />
              )}

              <div className={clsx("flex flex-col gap-0.5", collapsed && "items-center")}>
                {section.items.filter(isNavItemEnabled).map((item) => {
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
                        "group relative flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-150",
                        collapsed ? "h-9 w-9 justify-center" : "px-3 py-2",
                        active
                          ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                          : "text-text-secondary hover:bg-surface-3 hover:text-text-primary"
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
        {/* Settings (reference: same nav item style) */}
        <div className={clsx("flex flex-col gap-0.5", collapsed && "items-center")}>
          {bottomItems.filter(isNavItemEnabled).map((item) => {
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
                  "group flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-150",
                  collapsed ? "h-9 w-9 justify-center" : "px-3 py-2",
                  active
                    ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25"
                    : "text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                )}
              >
                <Icon className={clsx("h-[18px] w-[18px] shrink-0", collapsed && "h-5 w-5")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* User section (minimal so nav remains focus) */}
        <div
          className={clsx(
            "mt-3 flex items-center gap-2.5 rounded-xl bg-surface-3 transition-colors hover:bg-accent-100",
            collapsed ? "justify-center p-2" : "p-2.5"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white font-semibold text-xs overflow-hidden">
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
              <div className="truncate text-[13px] font-semibold text-text-primary">
                {displayName}
              </div>
              <div className="truncate text-[11px] text-text-tertiary">
                {user?.email || "Loading..."}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent-200 hover:text-text-secondary"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
