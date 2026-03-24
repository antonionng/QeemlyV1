"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MarketRefreshBanner } from "@/components/dashboard/market-refresh-banner";
import { DashboardTopBar } from "@/components/dashboard/topbar";
import { MobileSidebarDrawer } from "@/components/dashboard/mobile-drawer";
import { AIDrawer, type AIDrawerInitialRequest } from "@/components/dashboard/ai-drawer";
import type { EmployeeContextSnapshot } from "@/lib/ai/chat/threads";
import { useLocalStorageBoolean } from "@/lib/use-local-storage";

type DashboardShellProps = {
  children: ReactNode;
};

const SIDEBAR_COLLAPSED_KEY = "qeemly:dashSidebarCollapsed";
const OPEN_AI_DRAWER_EVENT = "qeemly:open-ai-drawer";

type OpenAIDrawerEventDetail = {
  mode?: AIDrawerInitialRequest["mode"];
  employeeId?: string;
  employee?: EmployeeContextSnapshot;
  message?: string;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorageBoolean(SIDEBAR_COLLAPSED_KEY, false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [initialAIRequest, setInitialAIRequest] = useState<AIDrawerInitialRequest | null>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  // Prevent body scroll when mobile drawer or AI drawer is open
  useEffect(() => {
    if (!mobileOpen && !aiOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen, aiOpen]);

  useEffect(() => {
    const handleOpenAIDrawer = (event: Event) => {
      const customEvent = event as CustomEvent<OpenAIDrawerEventDetail>;
      const detail = customEvent.detail;

      setAiOpen(true);
      if (!detail?.message?.trim()) {
        return;
      }

      setInitialAIRequest({
        requestId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        mode: detail.mode === "employee" && detail.employeeId ? "employee" : "general",
        employeeId: detail.employeeId,
        employee: detail.employee,
        message: detail.message.trim(),
      });
    };

    window.addEventListener(OPEN_AI_DRAWER_EVENT, handleOpenAIDrawer as EventListener);
    return () =>
      window.removeEventListener(OPEN_AI_DRAWER_EVENT, handleOpenAIDrawer as EventListener);
  }, []);

  return (
    <div className="relative min-h-screen min-w-0 bg-surface-2 text-text-primary">
      {/* Fixed sidebar (desktop only via CSS) */}
      <aside className="dash-sidebar" data-collapsed={sidebarCollapsed}>
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </aside>

      {/* Main content area with left margin for sidebar */}
      <div className="dash-main min-w-0" data-sidebar-collapsed={sidebarCollapsed}>
        <DashboardTopBar
          onMobileOpen={() => setMobileOpen(true)}
          onAIOpen={() => setAiOpen(true)}
          mobileTriggerRef={mobileTriggerRef}
        />

        <main className="min-w-0 px-4 pb-12 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6">
          <div className="responsive-page-shell min-w-0">
            <MarketRefreshBanner />
            {children}
          </div>
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
        initialRequest={initialAIRequest}
        onInitialRequestHandled={() => setInitialAIRequest(null)}
      />
    </div>
  );
}
