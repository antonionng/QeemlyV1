"use client";

import { type RefObject } from "react";
import { Menu, Search, Sparkles } from "lucide-react";
import { AuthenticatedUserMenu } from "@/components/auth/authenticated-user-menu";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";

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

          <AuthenticatedUserMenu variant="compact" />
        </div>
      </div>
    </header>
  );
}

