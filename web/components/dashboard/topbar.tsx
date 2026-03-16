"use client";

import { useEffect, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { isFeatureEnabled } from "@/lib/release/ga-scope";

type DashboardTopBarProps = {
  onMobileOpen: () => void;
  onAIOpen: () => void;
  mobileTriggerRef: RefObject<HTMLButtonElement>;
};

type DashboardUser = {
  email?: string | null;
} | null;

type DashboardProfile = {
  full_name?: string | null;
  avatar_url?: string | null;
} | null;

export function DashboardTopBar({
  onMobileOpen,
  onAIOpen,
  mobileTriggerRef,
}: DashboardTopBarProps) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser>(null);
  const [profile, setProfile] = useState<DashboardProfile>(null);
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profile);

        try {
          const adminAccessResponse = await fetch("/api/admin/workspaces/list");
          setCanAccessAdmin(adminAccessResponse.ok);
        } catch {
          setCanAccessAdmin(false);
        }
      } else {
        setCanAccessAdmin(false);
      }
    }
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const userInitial = profile?.full_name 
    ? profile.full_name.charAt(0).toUpperCase() 
    : user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-surface-1/95 shadow-[var(--dash-card-shadow)] backdrop-blur supports-[backdrop-filter]:bg-surface-1/80">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:gap-6 lg:px-8">
        {/* Mobile: hamburger + logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            ref={mobileTriggerRef}
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-3 focus-visible:outline-none"
            aria-label="Open menu"
            onClick={onMobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo compact href="/dashboard" />
        </div>

        {/* Desktop: prominent search bar */}
        <div className="hidden min-w-0 flex-1 items-center lg:flex">
          <div className="group flex h-11 w-full max-w-3xl items-center gap-3 rounded-xl border border-border/80 bg-white px-4 shadow-sm transition-all duration-200 hover:border-brand-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100">
            <Search className="h-4 w-4 shrink-0 text-accent-400 transition-colors group-focus-within:text-brand-500" />
            <Input
              placeholder="Search benchmarks, reports..."
              className="h-full w-full border-none bg-transparent px-0 text-sm text-accent-800 shadow-none placeholder:text-accent-400 focus-visible:outline-none"
            />
            <kbd className="hidden shrink-0 rounded-md border border-border bg-accent-50 px-2 py-0.5 text-[10px] font-medium text-accent-500 sm:inline-block">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-2.5">
          {/* Mobile search */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-3 transition-colors hover:bg-accent-200 lg:hidden"
            aria-label="Search"
          >
            <Search className="h-4 w-4 text-text-secondary" />
          </button>

          {/* AI Chat Button */}
          <button
            type="button"
            onClick={onAIOpen}
            className="ai-chat-btn flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white transition-colors hover:bg-brand-600 focus-visible:outline-none"
            aria-label="Chat with Qeemly AI"
            title="Chat with Qeemly AI"
          >
            <Sparkles className="h-[18px] w-[18px]" />
          </button>

          {/* User Profile Dropdown */}
          <DropdownMenu
            align="right"
            trigger={
              <div className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-brand-800 text-sm font-semibold text-white transition-colors hover:bg-brand-700 shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name ?? "User avatar"} className="h-full w-full object-cover" />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
            }
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-border/50">
              <div className="font-semibold text-brand-900">{profile?.full_name || "User"}</div>
              <div className="text-xs text-brand-600/80">{user?.email}</div>
            </div>

            <div className="py-1">
              <DropdownItem icon={<User className="h-4 w-4" />} href="/dashboard/profile">
                Profile
              </DropdownItem>
              <DropdownItem icon={<Settings className="h-4 w-4" />} href="/dashboard/settings">
                Account Settings
              </DropdownItem>
              {isFeatureEnabled("billing") && (
                <DropdownItem icon={<CreditCard className="h-4 w-4" />} href="/dashboard/billing">
                  Billing
                </DropdownItem>
              )}
              <DropdownItem icon={<Users className="h-4 w-4" />} href="/dashboard/team">
                Team
              </DropdownItem>
              <DropdownItem icon={<HelpCircle className="h-4 w-4" />} href="/help">
                Help
              </DropdownItem>
              {canAccessAdmin && (
                <DropdownItem icon={<Shield className="h-4 w-4" />} href="/admin">
                  Super Admin
                </DropdownItem>
              )}
            </div>

            <DropdownDivider />

            <DropdownItem
              icon={<LogOut className="h-4 w-4" />}
              variant="danger"
              onClick={handleSignOut}
            >
              Sign Out
            </DropdownItem>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

