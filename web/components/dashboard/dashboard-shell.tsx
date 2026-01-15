"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopBar } from "@/components/dashboard/topbar";
import { MobileSidebarDrawer } from "@/components/dashboard/mobile-drawer";
import { AIDrawer } from "@/components/dashboard/ai-drawer";
import { useLocalStorageBoolean } from "@/lib/use-local-storage";

type DashboardShellProps = {
  children: ReactNode;
};

const SIDEBAR_COLLAPSED_KEY = "qeemly:dashSidebarCollapsed";

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorageBoolean(SIDEBAR_COLLAPSED_KEY, false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Prevent body scroll when mobile drawer or AI drawer is open
  useEffect(() => {
    if (!mobileOpen && !aiOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen, aiOpen]);

  return (
    <div className="relative min-h-screen bg-white text-foreground">
      {/* Ambient background */}
      <div className="dash-bg" />

      {/* Fixed sidebar (desktop only via CSS) */}
      <aside className="dash-sidebar" data-collapsed={sidebarCollapsed}>
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </aside>

      {/* Main content area with left margin for sidebar */}
      <div className="dash-main" data-sidebar-collapsed={sidebarCollapsed}>
        <DashboardTopBar
          onMobileOpen={() => setMobileOpen(true)}
          onAIOpen={() => setAiOpen(true)}
          mobileTriggerRef={mobileTriggerRef}
        />

        <main className="px-6 pb-12 pt-8 lg:px-10">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>

      {/* Mobile drawer */}
      <MobileSidebarDrawer
        open={mobileOpen}
        onOpenChange={(next) => setMobileOpen(next)}
        returnFocusRef={mobileTriggerRef}
      />

      {/* AI Sidekick Drawer */}
      <AIDrawer 
        isOpen={aiOpen} 
        onClose={() => setAiOpen(false)} 
      />
    </div>
  );
}
