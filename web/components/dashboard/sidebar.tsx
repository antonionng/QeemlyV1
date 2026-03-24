"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  ChartColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  DollarSign,
  Globe2,
  LayoutGrid,
  type LucideIcon,
  Plug,
  Settings,
  Upload,
  Users,
  UserRound,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { useCompanySettings } from "@/lib/company";
import { getDashboardOverviewRoutes } from "@/lib/company-vs-market";
import { isFeatureEnabled, type FeatureKey } from "@/lib/release/ga-scope";
import { WorkspaceSwitcher } from "./workspace-switcher";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  featureKey?: FeatureKey;
};

type NavSection = {
  label: string | null;
  items: NavItem[];
};

const adminNavSections: NavSection[] = [
  {
    label: "Company",
    items: [
      { href: getDashboardOverviewRoutes()[0].href, label: getDashboardOverviewRoutes()[0].label, icon: LayoutGrid },
      { href: getDashboardOverviewRoutes()[1].href, label: getDashboardOverviewRoutes()[1].label, icon: ChartColumnIncreasing },
      { href: "/dashboard/people", label: "People", icon: Users },
      { href: "/dashboard/salary-review", label: "Salary Review", icon: DollarSign },
      { href: "/dashboard/integrations", label: "Integrations", icon: Plug, featureKey: "integrations" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/dashboard/relocation", label: "CoL Calculator", icon: Globe2 },
      { href: "/dashboard/upload", label: "Upload Data", icon: Upload },
      { href: "/dashboard/data/runs", label: "Data Runs", icon: Database },
    ],
  },
];

const employeeNavSections: NavSection[] = [
  {
    label: null,
    items: [
      { href: "/dashboard/me", label: "My Compensation", icon: Wallet },
      { href: "/dashboard/me/history", label: "My History", icon: Clock3 },
      { href: "/dashboard/me/profile", label: "My Profile", icon: UserRound },
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

const EXPANDED_ACTIVE_STYLE = {
  background: "linear-gradient(90deg,#6B5BFF,#4C5CE7)",
  boxShadow: "0 6px 12px rgba(92,93,237,0.25)",
};

const COLLAPSED_ACTIVE_STYLE = {
  background: "linear-gradient(90deg,#6B5BFF,#4C5CE7)",
};

type SidebarNavLinkProps = {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
};

function SidebarNavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: SidebarNavLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      style={active ? (collapsed ? COLLAPSED_ACTIVE_STYLE : EXPANDED_ACTIVE_STYLE) : undefined}
      className={clsx(
        "group flex items-center text-[15px] font-medium transition-[background,color,box-shadow] duration-200 ease-out",
        collapsed
          ? "h-11 w-11 justify-center rounded-[10px] text-[#374151] hover:bg-[#F5F6FA]"
          : "h-11 gap-3 rounded-[12px] px-4 text-[#374151] hover:bg-[#F5F6FA]",
        active && "text-white hover:bg-transparent",
      )}
    >
      <Icon className={clsx("h-5 w-5 shrink-0", active ? "text-white" : "text-[#374151]")} strokeWidth={2} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function DashboardSidebar({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const companySettings = useCompanySettings();

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

  const displayName = user?.fullName || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();
  const profileTooltip = user?.email ? `${displayName} (${user.email})` : displayName;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-white">
      <div
        className={clsx(
          "relative flex h-14 shrink-0 items-center px-5",
          collapsed ? "justify-center px-4" : "justify-start"
        )}
      >
        {collapsed ? (
          <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[#EEF1F6] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Qeemly" className="h-full w-full object-contain p-1" />
            </div>
          </Link>
        ) : (
          <Link href="/dashboard" className="min-w-0">
            <div className="flex items-center">
              <Logo compact href={null} />
            </div>
          </Link>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="absolute right-4 top-[18px] hidden h-5 w-5 items-center justify-center text-[#6B5BFF] lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" strokeWidth={2} /> : <ChevronLeft className="h-5 w-5" strokeWidth={2} />}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="min-w-0 shrink-0 px-3 pb-2 pt-1">
          <WorkspaceSwitcher />
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pt-1">
          <nav className="flex flex-col gap-[18px]">
            {navSections.map((section, sectionIndex) => (
              <div key={`${section.label ?? "primary"}-${sectionIndex}`} className="flex flex-col">
                {!collapsed && section.label && (
                  <p className="mb-2 mt-6 px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                    {section.label.toUpperCase()}
                  </p>
                )}
                <div className={clsx("flex flex-col gap-1.5 px-3", collapsed && "items-center")}>
                  {section.items.filter(isNavItemEnabled).map((item) => (
                    <SidebarNavLink
                      key={item.href}
                      item={item}
                      active={isActiveRoute(pathname, item.href)}
                      collapsed={collapsed}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="shrink-0 px-3 pb-4 pt-3">
          <div className={clsx("flex flex-col gap-1.5", collapsed && "items-center")}>
            {bottomItems.filter(isNavItemEnabled).map((item) => (
              <SidebarNavLink
                key={item.href}
                item={item}
                active={isActiveRoute(pathname, item.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>

          <div
            title={collapsed ? profileTooltip : undefined}
            className={clsx(
              "mt-3 flex items-center gap-2.5 rounded-[14px] bg-[#F5F6FA]",
              collapsed ? "h-11 w-11 justify-center p-0" : "px-3 py-2.5"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#111827] text-sm font-semibold text-white">
              {user?.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-[#111827]">
                  {displayName}
                </div>
                <div className="truncate text-[12px] text-[#6B7280]">
                  {user?.email || "Loading..."}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
