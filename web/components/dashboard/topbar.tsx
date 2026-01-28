"use client";

import { useEffect, useState, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  Settings,
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

type DashboardTopBarProps = {
  onMobileOpen: () => void;
  onAIOpen: () => void;
  mobileTriggerRef: RefObject<HTMLButtonElement>;
};

export function DashboardTopBar({
  onMobileOpen,
  onAIOpen,
  mobileTriggerRef,
}: DashboardTopBarProps) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

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
    <header className="sticky top-0 z-20 border-b border-border/40 bg-white/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-4 px-6 lg:px-10">
        {/* Mobile: hamburger + logo */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            ref={mobileTriggerRef}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-brand-800/80 transition-colors hover:bg-brand-100/70 focus-visible:outline-none"
            aria-label="Open menu"
            onClick={onMobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo compact href="/dashboard" />
        </div>

        {/* Full-width search bar */}
        <div className="hidden flex-1 items-center justify-center gap-3 lg:flex">
          <div className="search-glow flex w-full max-w-2xl items-center gap-2 rounded-xl bg-brand-50/70 px-4 ring-1 ring-border/50 transition-all focus-within:bg-white focus-within:ring-brand-400/60">
            <Search className="h-4 w-4 shrink-0 text-brand-600" />
            <Input
              placeholder="Search benchmarks, reports..."
              className="h-11 w-full border-none bg-transparent px-0 text-sm shadow-none placeholder:text-brand-700/50 focus:border-transparent focus-visible:outline-none"
            />
            <kbd className="hidden shrink-0 rounded-md bg-brand-100/80 px-2 py-1 text-[11px] font-medium text-brand-700/70 sm:inline-block">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50/70 transition-colors hover:bg-brand-100 lg:hidden"
            aria-label="Search"
          >
            <Search className="h-4 w-4 text-brand-700" />
          </button>

          {/* AI Chat Button */}
          <button
            type="button"
            onClick={onAIOpen}
            className="ai-chat-btn group relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25 transition-all hover:shadow-lg hover:shadow-brand-500/30 hover:scale-105"
            aria-label="Chat with Qeemly AI"
            title="Chat with Qeemly AI"
          >
            <Sparkles className="h-[18px] w-[18px]" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Qeemly AI
            </span>
          </button>

          {/* User Profile Dropdown */}
          <DropdownMenu
            align="right"
            trigger={
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-900 text-white font-semibold text-sm transition-all hover:bg-brand-800 hover:scale-105 cursor-pointer overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
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
              <DropdownItem icon={<CreditCard className="h-4 w-4" />} href="/dashboard/billing">
                Billing
              </DropdownItem>
              <DropdownItem icon={<Users className="h-4 w-4" />} href="/dashboard/team">
                Team
              </DropdownItem>
              <DropdownItem icon={<HelpCircle className="h-4 w-4" />} href="/help">
                Help
              </DropdownItem>
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

